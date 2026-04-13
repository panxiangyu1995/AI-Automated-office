//! TenderPage - 招投标模块主页

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Briefcase, AlertTriangle } from 'lucide-react';

export function TenderPage() {
  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">招投标管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理资质证书、业绩案例和投标项目
          </p>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 快速入口 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">资质管理</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                有效资质证书
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">业绩案例</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                已完成项目
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">到期提醒</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">0</div>
              <p className="text-xs text-muted-foreground">
                即将到期的资质
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* 标签页 */}
        <Tabs defaultValue="qualifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="qualifications">资质管理</TabsTrigger>
            <TabsTrigger value="cases">业绩案例</TabsTrigger>
          </TabsList>
          
          <TabsContent value="qualifications" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">
                管理公司资质证书，包括营业执照、安全许可证等
              </div>
              <div className="flex gap-2">
                <div className="text-sm text-muted-foreground">
                  共 0 个资质
                </div>
              </div>
            </div>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">暂无资质证书</p>
                  <p className="text-sm text-muted-foreground">
                    资质管理功能正在完善中
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cases" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">
                管理已完成的项目案例，用于招投标业绩展示
              </div>
              <div className="flex gap-2">
                <div className="text-sm text-muted-foreground">
                  共 0 个案例
                </div>
              </div>
            </div>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">暂无业绩案例</p>
                  <p className="text-sm text-muted-foreground">
                    业绩案例管理功能正在完善中
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
