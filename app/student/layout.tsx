import { ShowcaseStudentProvider } from "@/components/showcase/ShowcaseStudentProvider";

export default function StudentWorkspaceLayout({ children }: { children: React.ReactNode }) { return <ShowcaseStudentProvider>{children}</ShowcaseStudentProvider>; }
