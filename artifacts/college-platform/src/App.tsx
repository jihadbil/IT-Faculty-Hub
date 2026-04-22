import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { AuthProvider, useAuth, type Role } from "@/lib/auth";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseDetails from "@/pages/course-details";
import Files from "@/pages/files";
import Schedule from "@/pages/schedule";
import StudentHome from "@/pages/student/home";
import StudentCourses from "@/pages/student/courses";
import StudentCourse from "@/pages/student/course";
import StudentFiles from "@/pages/student/files";
import StudentSchedule from "@/pages/student/schedule";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDepartments from "@/pages/admin/departments";
import AdminTeachers from "@/pages/admin/teachers";
import AdminStudents from "@/pages/admin/students";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : role === "teacher" ? "/" : "/student";
}

function Protected({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Redirect to="/login" />;
  if (roles && !roles.includes(user.role)) return <Redirect to={homeFor(user.role)} />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Redirect to={homeFor(user.role)} />;
  return <>{children}</>;
}

function ProtectedLayoutRoutes() {
  return (
    <Layout>
      <Switch>
        {/* Admin */}
        <Route path="/admin">
          <Protected roles={["admin"]}><AdminDashboard /></Protected>
        </Route>
        <Route path="/admin/departments">
          <Protected roles={["admin"]}><AdminDepartments /></Protected>
        </Route>
        <Route path="/admin/teachers">
          <Protected roles={["admin"]}><AdminTeachers /></Protected>
        </Route>
        <Route path="/admin/students">
          <Protected roles={["admin"]}><AdminStudents /></Protected>
        </Route>
        <Route path="/admin/courses">
          <Protected roles={["admin"]}><Courses /></Protected>
        </Route>
        <Route path="/admin/courses/:id">
          <Protected roles={["admin"]}><CourseDetails /></Protected>
        </Route>
        <Route path="/admin/schedule">
          <Protected roles={["admin"]}><Schedule /></Protected>
        </Route>

        {/* Teacher */}
        <Route path="/">
          <Protected roles={["teacher"]}><Dashboard /></Protected>
        </Route>
        <Route path="/courses">
          <Protected roles={["teacher"]}><Courses /></Protected>
        </Route>
        <Route path="/courses/:id">
          <Protected roles={["teacher"]}><CourseDetails /></Protected>
        </Route>
        <Route path="/files">
          <Protected roles={["teacher"]}><Files /></Protected>
        </Route>
        <Route path="/schedule">
          <Protected roles={["teacher"]}><Schedule /></Protected>
        </Route>

        {/* Student */}
        <Route path="/student">
          <Protected roles={["student"]}><StudentHome /></Protected>
        </Route>
        <Route path="/student/courses">
          <Protected roles={["student"]}><StudentCourses /></Protected>
        </Route>
        <Route path="/student/courses/:id">
          <Protected roles={["student"]}><StudentCourse /></Protected>
        </Route>
        <Route path="/student/files">
          <Protected roles={["student"]}><StudentFiles /></Protected>
        </Route>
        <Route path="/student/schedule">
          <Protected roles={["student"]}><StudentSchedule /></Protected>
        </Route>

        <Route><NotFound /></Route>
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicOnly><LoginPage /></PublicOnly>
      </Route>
      <Route path="/register">
        <PublicOnly><RegisterPage /></PublicOnly>
      </Route>
      <Route>
        <ProtectedLayoutRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
