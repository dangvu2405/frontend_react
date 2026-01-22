import axiosInstance from '@/services/axios';
import type { Project } from '@/types/models/product';
import type { AdminProjectsFormState } from '../types';

export interface ProjectQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
}

const ADMIN_PROJECTS_ENDPOINT = '/admin/projects';
const ADMIN_CATEGORIES_ENDPOINT = '/admin/categories';
const PROJECT_UPLOAD_ENDPOINT = '/admin/projects/upload-image';

const adminProjectsService = {
  getProjects(params: ProjectQuery) {
    return axiosInstance.get(ADMIN_PROJECTS_ENDPOINT, { params });
  },

  getCategories() {
    return axiosInstance.get(ADMIN_CATEGORIES_ENDPOINT);
  },

  uploadImage(base64: string) {
    return axiosInstance.post(PROJECT_UPLOAD_ENDPOINT, { file: base64 });
  },

  createProject(payload: Partial<AdminProjectsFormState>) {
    return axiosInstance.post(ADMIN_PROJECTS_ENDPOINT, payload);
  },

  updateProject(projectId: string, payload: Partial<AdminProjectsFormState>) {
    return axiosInstance.put(`${ADMIN_PROJECTS_ENDPOINT}/${projectId}`, payload);
  },

  deleteProject(projectId: string) {
    return axiosInstance.delete(`${ADMIN_PROJECTS_ENDPOINT}/${projectId}`);
  },

  getProject(projectId: string) {
    return axiosInstance.get<Project>(`${ADMIN_PROJECTS_ENDPOINT}/${projectId}`);
  },
};

export default adminProjectsService;

