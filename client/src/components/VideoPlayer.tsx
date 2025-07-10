import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Subject } from "@/lib/openai";
import { Video } from "lucide-react";
import SubjectIcon from "./SubjectIcon";

interface VideoPlayerProps {
  subject: Subject;
  user: any;
  onBack: () => void;
}

export default function VideoPlayer({ subject, user, onBack }: VideoPlayerProps) {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["/api/videos", subject.id],
    enabled: !!subject.id,
  });

  const videoList = videos?.videos || [];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${subject.color} rounded-lg flex items-center justify-center`}>
            <SubjectIcon iconName={subject.icon} className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{subject.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Video bài giảng</p>
          </div>
        </div>
      </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Video List */}
          <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Danh sách video</h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : videoList.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Chưa có video nào cho môn học này
                </p>
              ) : (
                <div className="space-y-2">
                  {videoList.map((video: any) => (
                    <Card
                      key={video.id}
                      className={`cursor-pointer transition-colors ${
                        selectedVideo?.id === video.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                          {video.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {video.duration || "10:00"} phút
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Video Player */}
          <div className="flex-1 p-8">
            {selectedVideo ? (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {selectedVideo.title}
                </h2>
                <div className="aspect-video bg-black rounded-lg mb-4">
                  {/* Video player placeholder */}
                  <div className="h-full flex items-center justify-center text-white">
                    <p>Video player sẽ được hiển thị ở đây</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedVideo.description || "Mô tả video sẽ được hiển thị ở đây"}
                </p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Chọn một video từ danh sách để bắt đầu xem
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}