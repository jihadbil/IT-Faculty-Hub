import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
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

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Teacher / Admin */}
        <Route path="/" component={Dashboard} />
        <Route path="/courses" component={Courses} />
        <Route path="/courses/:id" component={CourseDetails} />
        <Route path="/files" component={Files} />
        <Route path="/schedule" component={Schedule} />

        {/* Student portal */}
        <Route path="/student" component={StudentHome} />
        <Route path="/student/courses" component={StudentCourses} />
        <Route path="/student/courses/:id" component={StudentCourse} />
        <Route path="/student/files" component={StudentFiles} />
        <Route path="/student/schedule" component={StudentSchedule} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
