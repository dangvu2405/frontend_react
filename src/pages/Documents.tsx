import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, BookOpen } from 'lucide-react';
import { useState } from 'react';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  // TODO: Fetch documents from API
  // useEffect(() => {
  //   const fetchDocuments = async () => {
  //     setLoading(true);
  //     try {
  //       const response = await documentsService.getDocuments({ search: searchQuery });
  //       setDocuments(response.documents);
  //     } catch (error) {
  //       console.error('Error fetching documents:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchDocuments();
  // }, [searchQuery]);

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Tài liệu học tập</h1>
          <p className="text-muted-foreground text-lg">
            Tổng hợp tài liệu, hướng dẫn và tài nguyên học tập cho các môn học
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Đang tải tài liệu...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg mb-2">Chưa có tài liệu nào</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Không tìm thấy tài liệu phù hợp với từ khóa của bạn'
                  : 'Tài liệu sẽ được cập nhật sớm'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{doc.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{doc.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{doc.fileSize}</span>
                        <span>{doc.downloads?.toLocaleString('vi-VN')} lượt tải</span>
                        <span>{doc.category}</span>
                      </div>
                    </div>
                    <Button>Tải xuống</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
