/**
 * TechStackBadges Component
 * Hiển thị danh sách công nghệ dưới dạng badges với icons
 */

import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  Database, 
  Smartphone, 
  Brain, 
  Globe, 
  Server, 
  Cloud,
  Cpu,
  FileCode,
  Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TechStackBadgesProps {
  techStack: string[];
  className?: string;
  variant?: "default" | "secondary" | "outline";
  showIcons?: boolean;
}

// Map tech names to icons
const getTechIcon = (tech: string) => {
  const techLower = tech.toLowerCase();
  
  if (techLower.includes('react') || techLower.includes('vue') || techLower.includes('angular')) {
    return <Code className="w-3 h-3 mr-1" />;
  }
  if (techLower.includes('node') || techLower.includes('express') || techLower.includes('nest')) {
    return <Server className="w-3 h-3 mr-1" />;
  }
  if (techLower.includes('mongodb') || techLower.includes('mysql') || techLower.includes('postgres') || techLower.includes('database')) {
    return <Database className="w-3 h-3 mr-1" />;
  }
  if (techLower.includes('mobile') || techLower.includes('android') || techLower.includes('ios') || techLower.includes('flutter') || techLower.includes('react native')) {
    return <Smartphone className="w-3 h-3 mr-1" />;
  }
  if (techLower.includes('ai') || techLower.includes('ml') || techLower.includes('machine learning') || techLower.includes('tensorflow') || techLower.includes('pytorch')) {
    return <Brain className="w-3 h-3 mr-1" />;
  }
  if (techLower.includes('aws') || techLower.includes('azure') || techLower.includes('gcp') || techLower.includes('cloud')) {
    return <Cloud className="w-3 h-3 mr-1" />;
  }
  if (techLower.includes('python') || techLower.includes('java') || techLower.includes('c++') || techLower.includes('cpp')) {
    return <FileCode className="w-3 h-3 mr-1" />;
  }
  if (techLower.includes('docker') || techLower.includes('kubernetes') || techLower.includes('devops')) {
    return <Terminal className="w-3 h-3 mr-1" />;
  }
  
  return <Code className="w-3 h-3 mr-1" />;
};

export function TechStackBadges({ 
  techStack, 
  className,
  variant = "secondary",
  showIcons = true 
}: TechStackBadgesProps) {
  if (!techStack || techStack.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {techStack.map((tech, index) => (
        <Badge 
          key={`${tech}-${index}`} 
          variant={variant}
          className="text-xs font-medium"
        >
          {showIcons && getTechIcon(tech)}
          <span>{tech}</span>
        </Badge>
      ))}
    </div>
  );
}
