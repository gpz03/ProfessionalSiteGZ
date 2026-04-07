import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Projects from "@/pages/projects";
import Experience from "@/pages/experience";
import Skills from "@/pages/skills";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Nav from "@/components/Nav";

function Router() {
  return (
    <>
      <Nav />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/projects" component={Projects} />
        <Route path="/experience" component={Experience} />
        <Route path="/skills" component={Skills} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  const base = import.meta.env.BASE_URL;
  const routerBase = base === "./" || base === "." ? "" : base.replace(/\/$/, "");

  return (
    <TooltipProvider>
      <WouterRouter base={routerBase}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
