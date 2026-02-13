import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout } from "@/components/layout/Layout";
import Index from "./pages/Index";
import COTReports from "./pages/COTReports";
import NewsFeed from "./pages/NewsFeed";
import GammaExposure from "./pages/GammaExposure";
import Crudeeeeee from "./pages/Crudeeeeee";
import CrudeOil from "./pages/CrudeOil";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Disclaimer from "./pages/Disclaimer";
import NotFound from "./pages/NotFound";
import AAIISentiment from "./pages/AAIISentiment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cot-reports" element={<COTReports />} />
              <Route path="/news" element={<NewsFeed />} />
              <Route path="/gamma" element={<GammaExposure />} />
              <Route path="/cru" element={<Crudeeeeee />} />
              <Route path="/crude-oil" element={<CrudeOil />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/aaii" element={<AAIISentiment />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
