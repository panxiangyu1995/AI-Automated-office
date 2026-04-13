//! MarketingPage - 市场宣传模块主页

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, FileText, Share2, TrendingUp } from 'lucide-react';

export function MarketingPage() {
  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">市场宣传</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理营销活动、内容和渠道
          </p>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 快速入口 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">营销活动</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">进行中</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">营销内容</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">已发布</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">推广渠道</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">活跃渠道</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总触达</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">曝光次数</p>
            </CardContent>
          </Card>
        </div>
        
        {/* 标签页 */}
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="campaigns">营销活动</TabsTrigger>
            <TabsTrigger value="contents">营销内容</TabsTrigger>
            <TabsTrigger value="channels">推广渠道</TabsTrigger>
          </TabsList>
          
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">管理营销活动，跟踪活动效果</div>
            </div>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">暂无营销活动</p>
                  <p className="text-sm text-muted-foreground">
                    营销活动管理功能正在完善中
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contents" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">管理营销内容，包括文章、视频、图片等</div>
            </div>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">暂无营销内容</p>
                  <p className="text-sm text-muted-foreground">
                    营销内容管理功能正在完善中
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="channels" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">管理推广渠道，包括微信、微博、抖音等</div>
            </div>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">暂无推广渠道</p>
                  <p className="text-sm text-muted-foreground">
                    推广渠道管理功能正在完善中
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
