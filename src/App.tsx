import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Nav from "@/components/Nav";
import DeploymentBadge from "@/components/DeploymentBadge";

function Router() {
  return (
    <>
      <Nav />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/projects" component={Home} />
        <Route path="/projects/:tab" component={Home} />
        <Route path="/experience" component={Home} />
        <Route path="/skills" component={Home} />
        <Route path="/about" component={Home} />
        <Route path="/contact" component={Home} />
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
      <DeploymentBadge />
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
