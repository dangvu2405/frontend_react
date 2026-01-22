import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectsGrid } from '@/components/projects';
import type { Project, Category } from '@/types/models/product';
import { projectsService } from '@/services/projectsService';

export const ProjectsView = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Debug: Log API call
        if (import.meta.env.DEV) {
          console.log('📦 [Projects Page] Fetching projects...', { limit: 60 });
        }
        
        const { projects: fetchedProjects } = await projectsService.getAllProjects({ limit: 60 });
        
        // Debug: Log API response
        if (import.meta.env.DEV && active) {
          console.log('📦 [Projects Page] Projects received:', {
            count: fetchedProjects.length,
            data: fetchedProjects,
          });
        }
        
        if (active) {
          setProjects(fetchedProjects);
        }
      } catch (error: unknown) {
        if (active) {
          if (import.meta.env.DEV) {
            console.error('📦 [Projects Page] Error fetching projects:', {
              error,
              message: error instanceof Error ? error.message : 'Unknown error',
              response: ((error as Record<string, unknown>)?.response as Record<string, unknown>)?.data,
            });
          }
          const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
          toast.error(errorMsg || 'Không thể tải đồ án');
          setProjects([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProjects();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const names = new Set<string>();
    projects.forEach((project) => {
      if (typeof project.MaLoaiSanPham === 'object' && project.MaLoaiSanPham?.TenLoaiSanPham) {
        names.add(project.MaLoaiSanPham.TenLoaiSanPham);
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        categoryFilter === 'all' ||
        (typeof project.MaLoaiSanPham === 'object' &&
          project.MaLoaiSanPham?.TenLoaiSanPham?.toLowerCase() === categoryFilter.toLowerCase());
      if (!matchesCategory) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        project.TenSanPham?.toLowerCase().includes(query) ||
        project.MoTa?.toLowerCase().includes(query)
      );
    });
  }, [categoryFilter, projects, search]);

  return (
    <MainLayout>
      <section className="bg-muted/40 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-wide text-primary">Bộ sưu tập</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">
            Khám phá các đồ án mới nhất
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Lựa chọn các đồ án chất lượng cao với ưu đãi hấp dẫn. Cập nhật mỗi tuần để đảm bảo bạn luôn có trải nghiệm mua sắm tốt nhất.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Tìm kiếm đồ án, danh mục..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full md:max-w-sm"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-60">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => {
            setSearch('');
            setCategoryFilter('all');
          }}>
            Xóa bộ lọc
          </Button>
        </div>

        <div className="mt-8">
          <ProjectsGrid
            projects={filteredProjects}
            loading={loading}
            emptyMessage="Không tìm thấy đồ án nào phù hợp."
            showAddToCartButton
          />
        </div>
      </section>
    </MainLayout>
  );
};

export default ProjectsView;

