import { ClassroomClient } from './client';
import { db } from '@/lib/database';
import { courses, enrollments, coursework, submissions, topics } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { classroom_v1 } from 'googleapis';

export interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  lastSyncAt: Date;
}

export class SyncService {
  private client: ClassroomClient;

  constructor(client: ClassroomClient) {
    this.client = client;
  }

  async syncCoursesForUser(userId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const classroom = await this.client.getClassroomService();
      let pageToken: string | undefined;
      
      do {
        const response = await classroom.courses.list({
          pageSize: 50,
          pageToken,
          courseStates: ['ACTIVE', 'ARCHIVED']
        });

        if (response.data.courses) {
          for (const course of response.data.courses) {
            try {
              await this.syncCourse(course, userId);
              synced++;
            } catch (error) {
              errors.push(`Failed to sync course ${course.id}: ${error}`);
            }
          }
        }

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);

      return {
        success: errors.length === 0,
        synced,
        errors,
        lastSyncAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        synced: 0,
        errors: [`Failed to fetch courses: ${error}`],
        lastSyncAt: new Date()
      };
    }
  }

  private async syncCourse(course: classroom_v1.Schema$Course, userId: string): Promise<void> {
    if (!course.id || !course.name) return;

    // Upsert course
    await db.insert(courses).values({
      id: crypto.randomUUID(),
      externalId: course.id,
      name: course.name,
      section: course.section || null,
      description: course.description || null,
      state: course.courseState as any || 'ACTIVE',
      ownerGoogleId: course.ownerId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: [courses.externalId],
      set: {
        name: course.name,
        section: course.section || null,
        description: course.description || null,
        state: course.courseState as any || 'ACTIVE',
        updatedAt: new Date()
      }
    });

    // Get the course ID from database
    const dbCourse = await db.query.courses.findFirst({
      where: eq(courses.externalId, course.id),
      columns: { id: true }
    });

    if (!dbCourse) return;

    // Sync enrollment for this user
    await this.syncUserEnrollment(course.id, dbCourse.id, userId);

    // Sync coursework and topics
    await this.syncCoursework(course.id, dbCourse.id);
    // await this.syncTopics(course.id, dbCourse.id);
  }

  private async syncUserEnrollment(courseExternalId: string, courseId: string, userId: string): Promise<void> {
    try {
      const classroom = await this.client.getClassroomService();
      
      // Check if user is a student
      try {
        const studentResponse = await classroom.courses.students.get({
          courseId: courseExternalId,
          userId: 'me'
        });

        if (studentResponse.data) {
          await db.insert(enrollments).values({
            id: crypto.randomUUID(),
            courseId,
            userId,
            roleInCourse: 'STUDENT',
            externalId: studentResponse.data.userId || null,
            createdAt: new Date()
          }).onConflictDoNothing();
        }
      } catch (error) {
        // User is not a student, check if teacher
        try {
          const teacherResponse = await classroom.courses.teachers.get({
            courseId: courseExternalId,
            userId: 'me'
          });

          if (teacherResponse.data) {
            await db.insert(enrollments).values({
              id: crypto.randomUUID(),
              courseId,
              userId,
              roleInCourse: 'TEACHER',
              externalId: teacherResponse.data.userId || null,
              createdAt: new Date()
            }).onConflictDoNothing();
          }
        } catch (teacherError) {
          // User might not be enrolled, that's ok
        }
      }
    } catch (error) {
      console.error('Failed to sync user enrollment:', error);
    }
  }

  async syncCoursework(courseExternalId: string, courseId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const classroom = await this.client.getClassroomService();
      let pageToken: string | undefined;

      do {
        const response = await classroom.courses.courseWork.list({
          courseId: courseExternalId,
          pageSize: 50,
          pageToken
        });

        console.log(response)

        if (response.data.courseWork) {
          for (const work of response.data.courseWork) {
            try {
              if (!work.id || !work.title) continue;

              await db.insert(coursework).values({
                id: crypto.randomUUID(),
                externalId: work.id,
                courseId,
                title: work.title,
                description: work.description || null,
                dueDate: work.dueDate ? new Date(`${work.dueDate.year}-${work.dueDate.month}-${work.dueDate.day}`) : null,
                maxPoints: work.maxPoints || null,
                state: work.state as any || 'PUBLISHED',
                topicId: work.topicId || null,
                createdAt: new Date(),
                updatedAt: new Date()
              }).onConflictDoUpdate({
                target: [coursework.externalId],
                set: {
                  title: work.title,
                  description: work.description || null,
                  dueDate: work.dueDate ? new Date(`${work.dueDate.year}-${work.dueDate.month}-${work.dueDate.day}`) : null,
                  maxPoints: work.maxPoints || null,
                  state: work.state as any || 'PUBLISHED',
                  updatedAt: new Date()
                }
              });

              synced++;
            } catch (error) {
              errors.push(`Failed to sync coursework ${work.id}: ${error}`);
            }
          }
        }

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);

      return {
        success: errors.length === 0,
        synced,
        errors,
        lastSyncAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        synced: 0,
        errors: [`Failed to fetch coursework: ${error}`],
        lastSyncAt: new Date()
      };
    }
  }

  async syncSubmissions(courseExternalId: string, courseworkExternalId: string, userId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const classroom = await this.client.getClassroomService();
      let pageToken: string | undefined;

      do {
        const response = await classroom.courses.courseWork.studentSubmissions.list({
          courseId: courseExternalId,
          courseWorkId: courseworkExternalId,
          pageSize: 50,
          pageToken,
          userId: 'me' // Only get submissions for the current user
        });

        if (response.data.studentSubmissions) {
          for (const submission of response.data.studentSubmissions) {
            try {
              if (!submission.id) continue;

              // Get coursework ID from database
              const dbCoursework = await db.query.coursework.findFirst({
                where: eq(coursework.externalId, courseworkExternalId),
                columns: { id: true }
              });

              if (!dbCoursework) continue;

              await db.insert(submissions).values({
                id: crypto.randomUUID(),
                externalId: submission.id,
                courseworkId: dbCoursework.id,
                studentId: userId,
                state: submission.state as any || 'NEW',
                late: submission.late || false,
                assignedAt: submission.creationTime ? new Date(submission.creationTime) : new Date(),
                turnedInAt: null, // TODO: Extract from submissionHistory
                returnedAt: null, // TODO: Extract from submissionHistory
                draftGrade: submission.draftGrade || null,
                assignedGrade: submission.assignedGrade || null,
                finalGrade: submission.assignedGrade || submission.draftGrade || null,
                createdAt: new Date(),
                updatedAt: new Date()
              }).onConflictDoUpdate({
                target: [submissions.externalId],
                set: {
                  state: submission.state as any || 'NEW',
                  late: submission.late || false,
                  turnedInAt: null, // TODO: Extract from submissionHistory
                  returnedAt: null, // TODO: Extract from submissionHistory
                  draftGrade: submission.draftGrade || null,
                  assignedGrade: submission.assignedGrade || null,
                  finalGrade: submission.assignedGrade || submission.draftGrade || null,
                  updatedAt: new Date()
                }
              });

              synced++;
            } catch (error) {
              errors.push(`Failed to sync submission ${submission.id}: ${error}`);
            }
          }
        }

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);

      return {
        success: errors.length === 0,
        synced,
        errors,
        lastSyncAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        synced: 0,
        errors: [`Failed to fetch submissions: ${error}`],
        lastSyncAt: new Date()
      };
    }
  }

  // private async syncTopics(courseExternalId: string, courseId: string): Promise<void> {
  //   try {
  //     const classroom = await this.client.getClassroomService();
      
  //     const response = await classroom.courses.topics.list({
  //       courseId: courseExternalId
  //     });

  //     if (response.data.topic) {
  //       for (const topic of response.data.topic) {
  //         if (!topic.topicId || !topic.name) continue;

  //         await db.insert(topics).values({
  //           id: crypto.randomUUID(),
  //           externalId: topic.topicId,
  //           courseId,
  //           name: topic.name,
  //           order: 0 // Google Classroom doesn't provide order
  //         }).onConflictDoUpdate({
  //           target: [topics.externalId],
  //           set: {
  //             name: topic.name
  //           }
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Failed to sync topics:', error);
  //   }
  // }

  async fullSyncForUser(userId: string): Promise<{ courses: SyncResult; coursework: SyncResult[]; submissions: SyncResult[] }> {
    // First sync courses
    const coursesResult = await this.syncCoursesForUser(userId);

    const courseworkResults: SyncResult[] = [];
    const submissionResults: SyncResult[] = [];

    // Get all courses for this user
    const userCourses = await db.query.courses.findMany({
      with: {
        enrollments: {
          where: eq(enrollments.userId, userId)
        }
      }
    });

    // Sync coursework and submissions for each course
    for (const course of userCourses) {
      if (course.enrollments.length === 0) continue;

      const courseworkResult = await this.syncCoursework(course.externalId, course.id);
      courseworkResults.push(courseworkResult);

      // Get coursework for this course to sync submissions
      const courseCoursework = await db.query.coursework.findMany({
        where: eq(coursework.courseId, course.id),
        columns: { externalId: true }
      });

      for (const work of courseCoursework) {
        const submissionResult = await this.syncSubmissions(course.externalId, work.externalId, userId);
        submissionResults.push(submissionResult);
      }
    }

    return {
      courses: coursesResult,
      coursework: courseworkResults,
      submissions: submissionResults
    };
  }
}

export async function createSyncService(userId: string): Promise<SyncService> {
  const client = new ClassroomClient(userId);
  return new SyncService(client);
}
