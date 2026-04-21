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

function Protected({
  role,
  children,
}: {
  role?: Role;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Redirect to="/login" />;

  if (role && user.role !== role) {
    // Send users to their own portal instead of showing 403
    return <Redirect to={user.role === "teacher" ? "/" : "/student"} />;
  }

  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Redirect to={user.role === "teacher" ? "/" : "/student"} />;
  return <>{children}</>;
}

function ProtectedLayoutRoutes() {
  return (
    <Layout>
      <Switch>
        {/* Teacher / Admin */}
        <Route path="/">
          <Protected role="teacher"><Dashboard /></Protected>
        </Route>
        <Route path="/courses">
          <Protected role="teacher"><Courses /></Protected>
        </Route>
        <Route path="/courses/:id">
          <Protected role="teacher"><CourseDetails /></Protected>
        </Route>
        <Route path="/files">
          <Protected role="teacher"><Files /></Protected>
        </Route>
        <Route path="/schedule">
          <Protected role="teacher"><Schedule /></Protected>
        </Route>

        {/* Student portal — accessible to any authenticated user */}
        <Route path="/student">
          <Protected><StudentHome /></Protected>
        </Route>
        <Route path="/student/courses">
          <Protected><StudentCourses /></Protected>
        </Route>
        <Route path="/student/courses/:id">
          <Protected><StudentCourse /></Protected>
        </Route>
        <Route path="/student/files">
          <Protected><StudentFiles /></Protected>
        </Route>
        <Route path="/student/schedule">
          <Protected><StudentSchedule /></Protected>
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
