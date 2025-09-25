import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export class GoogleClassroomService {
  private oauth2Client: OAuth2Client;
  private classroom: any;

  constructor(accessToken: string) {
    this.oauth2Client = new google.auth.OAuth2();
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    this.classroom = google.classroom({ version: "v1", auth: this.oauth2Client });
  }

  async getCourses() {
    try {
      const response = await this.classroom.courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"],
      });
      return response.data.courses || [];
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw error;
    }
  }

  async getCourseStudents(courseId: string) {
    try {
      const response = await this.classroom.courses.students.list({
        courseId,
      });
      return response.data.students || [];
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  }

  async getCourseWork(courseId: string) {
    try {
      const response = await this.classroom.courses.courseWork.list({
        courseId,
      });
      return response.data.courseWork || [];
    } catch (error) {
      console.error("Error fetching coursework:", error);
      throw error;
    }
  }

  async getStudentSubmissions(courseId: string, courseWorkId: string) {
    try {
      const response = await this.classroom.courses.courseWork.studentSubmissions.list({
        courseId,
        courseWorkId,
      });
      return response.data.studentSubmissions || [];
    } catch (error) {
      console.error("Error fetching submissions:", error);
      throw error;
    }
  }

  async getUserProfile() {
    try {
      const response = await this.classroom.userProfiles.get({
        userId: "me",
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }
}

export async function createGoogleClassroomService(accessToken: string) {
  return new GoogleClassroomService(accessToken);
}
