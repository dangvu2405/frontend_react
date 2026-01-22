import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Database, 
  Smartphone, 
  Brain, 
  Network, 
  Gamepad2, 
  GraduationCap,
  BookOpen,
  Video,
  FileText,
  MessageCircle
} from 'lucide-react';
import { useState } from 'react';

export default function SubjectSupportPage() {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [supportTypes, setSupportTypes] = useState<any[]>([]);

  // TODO: Fetch subjects and support types from API
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setLoading(true);
  //     try {
  //       const [subjectsRes, supportTypesRes] = await Promise.all([
  //         subjectSupportService.getSubjects(),
  //         subjectSupportService.getSupportTypes(),
  //       ]);
  //       setSubjects(subjectsRes.subjects);
  //       setSupportTypes(supportTypesRes.types);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchData();
  // }, []);

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Hỗ trợ môn học</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tài liệu, hướng dẫn và tài nguyên học tập cho các môn học công nghệ thông tin
          </p>
        </div>

        <Tabs defaultValue="subjects" className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="subjects">Môn học</TabsTrigger>
            <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            ) : subjects.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-lg mb-2">Chưa có môn học nào</p>
                  <p className="text-sm text-muted-foreground">
                    Danh sách môn học sẽ được cập nhật sớm
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {subjects.map((subject) => {
                  const Icon = subject.icon || Code;
                  return (
                    <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{subject.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{subject.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{subject.resources} tài liệu</span>
                              <span>{subject.projects} đồ án</span>
                            </div>
                          </div>
                          <Button variant="outline">Xem chi tiết</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            ) : supportTypes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-lg mb-2">Chưa có tài nguyên nào</p>
                  <p className="text-sm text-muted-foreground">
                    Tài nguyên sẽ được cập nhật sớm
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {supportTypes.map((type) => {
                  const Icon = type.icon || FileText;
                  return (
                    <Card key={type.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{type.name}</h3>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                          <Button variant="outline">Khám phá</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Help Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-semibold">Cần hỗ trợ?</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Nếu bạn gặp khó khăn trong quá trình học tập, hãy liên hệ với chúng tôi để được hỗ trợ
            </p>
            <div className="flex gap-4">
              <Button>Liên hệ hỗ trợ</Button>
              <Button variant="outline">Xem FAQ</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
