import axiosInstance from "./axios";
import { apiCache } from "@/utils/apiCache";
import type { Project, ProjectIncludesOption } from "@/types/models/product";
import type { ApiItemResponse, ApiListResponse, Pagination } from "@/types/models/common";

const normalizeIncludesOptions = (options?: ProjectIncludesOption[], fallbackIncludes?: number | null): ProjectIncludesOption[] => {
  let normalized: ProjectIncludesOption[] = Array.isArray(options) ? options.filter(Boolean) : [];

  if (!normalized.length && fallbackIncludes) {
    normalized = [{
      value: fallbackIncludes,
      label: `${fallbackIncludes} ml`,
      isDefault: true,
    }];
  }

  normalized = normalized.map((option, index) => {
    const value = Number(option.value);
    if (!Number.isFinite(value) || value < 0) return null;

    return {
      value,
      label: option.label || `${value} ml`,
      priceDiff: option.priceDiff || 0,
      stockDiff: option.stockDiff || 0,
      sku: option.sku,
      isDefault: option.isDefault ?? index === 0,
    };
  }).filter(Boolean) as ProjectIncludesOption[];

  if (!normalized.some(option => option.isDefault) && normalized.length) {
    normalized[0].isDefault = true;
  }

  return normalized;
};

const normalizeProject = (project: Project): Project => {
  const options = normalizeIncludesOptions(project.DungTichOptions, project.DungTich);
  const derivedIncludes = options.find(opt => opt.isDefault)?.value;
  return {
    ...project,
    DungTichOptions: options,
    DungTich: project.DungTich ?? derivedIncludes,
  };
};

export const projectsService = {
  getAllProjects: async (params?: { page?: number; limit?: number }): Promise<{ projects: Project[]; pagination?: Pagination }> => {
    const cacheKey = `projects:${JSON.stringify(params || {})}`;
    
    const cached = apiCache.get<{ projects: Project[]; pagination?: Pagination }>(cacheKey);
    if (cached && cached.projects && cached.projects.length > 0) {
      return cached;
    }

    if (import.meta.env.DEV) {
      console.log('[projectsService] Fetching projects with params:', params);
    }

    try {
      const response = await axiosInstance.get<ApiListResponse<Project>>("/api/projects", { params });
      const responseData = response.data as Record<string, unknown>;

      if (import.meta.env.DEV) {
        console.log('[projectsService] Raw response for getAllProjects:', responseData);
      }
      
      let projects: Project[] = [];
      let pagination: Pagination | undefined = undefined;
      
      const responseDataRecord = responseData as Record<string, unknown>;
      if (responseData && 'data' in responseDataRecord && Array.isArray(responseDataRecord.data)) {
        projects = responseDataRecord.data;
        pagination = responseDataRecord.pagination as Pagination | undefined;
      } else if (Array.isArray(responseData)) {
        projects = responseData;
      } else if (responseData && 'projects' in responseDataRecord && Array.isArray(responseDataRecord.projects)) {
        projects = responseDataRecord.projects;
        pagination = responseDataRecord.pagination as Pagination | undefined;
      } else if (responseData && typeof responseData === 'object') {
        for (const key of Object.keys(responseDataRecord)) {
          if (Array.isArray(responseDataRecord[key])) {
            projects = responseDataRecord[key];
            if (responseDataRecord.pagination) {
              pagination = responseDataRecord.pagination as Pagination | undefined;
            }
            break;
          }
        }
      }
      
      const result = {
        projects: (projects ?? []).map(normalizeProject),
        pagination: pagination
      };

      if (result.projects.length > 0) {
        apiCache.set(cacheKey, result, 5 * 60 * 1000);
      }

      return result;
    } catch (error: unknown) {
      // Handle 404 gracefully - API endpoint not implemented yet
      const errorRecord = error as Record<string, unknown>;
      const status = errorRecord?.status || (errorRecord?.response as Record<string, unknown>)?.status;
      
      if (status === 404) {
        if (import.meta.env.DEV) {
          console.warn('[projectsService] API endpoint /api/projects not implemented yet (404). Returning empty array.');
        }
        // Return empty array instead of throwing error
        return {
          projects: [],
          pagination: undefined
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  getProjectById: async (id: string): Promise<Project | null> => {
    try {
      const cacheKey = `project:${id}`;
      
      const cached = apiCache.get<Project>(cacheKey);
      if (cached) {
        return cached;
      }

      if (import.meta.env.DEV) {
        console.log(`[projectsService] Fetching project detail: ${id}`);
      }

      const response = await axiosInstance.get<ApiItemResponse<Project>>(`/api/projects/${id}`);
      const responseData = response.data as Record<string, unknown>;

      if (import.meta.env.DEV) {
        console.log('[projectsService] Raw response for getProjectById:', responseData);
      }
      
      let project: Project | null = null;
      
      // ✅ Backend trả { success, project } - check 'project' trước
      if (responseData && 'project' in responseData && responseData.project) {
        project = responseData.project as Project;
      } else if (responseData && 'data' in responseData && responseData.data) {
        // Fallback: nếu có 'data' thì dùng
        project = responseData.data as Project;
      } else if (responseData && typeof responseData === 'object' && !responseData.success && !Array.isArray(responseData)) {
        // Fallback: nếu responseData chính là project object
        if (responseData._id || responseData.id) {
          project = responseData as unknown as Project;
        }
      }

      if (project) {
        const normalizedProject = normalizeProject(project);
        apiCache.set(cacheKey, normalizedProject, 10 * 60 * 1000);
        return normalizedProject;
      }

      return null;
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error(`Error fetching project ${id}:`, error);
      }
      throw error;
    }
  },

  getProjectsByCategory: async (category: string): Promise<Project[]> => {
    try {
      const response = await axiosInstance.get<ApiListResponse<Project>>(`/api/projects?loaiSP=${category}`);
      const responseData = response.data as unknown as ApiListResponse<Project>;
      return (responseData && 'data' in responseData ? responseData.data : []) ?? [];
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error(`Error fetching projects by category ${category}:`, error);
      }
      throw error;
    }
  },

  searchProjects: async (keyword: string): Promise<Project[]> => {
    try {
      const response = await axiosInstance.get<ApiListResponse<Project>>(`/api/projects/search?q=${keyword}`);
      const responseData = response.data as unknown as ApiListResponse<Project>;
      return (responseData && 'data' in responseData ? responseData.data : []) ?? [];
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error(`Error searching projects with keyword ${keyword}:`, error);
      }
      throw error;
    }
  },
};
