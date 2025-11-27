import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Countdown from "@/components/Countdown";
import WeddingDetails from "@/components/WeddingDetails";
import Gallery from "@/components/Gallery";
import LoveStory from "@/components/LoveStory";
import RSVPForm from "@/components/RSVPForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Countdown />
        <WeddingDetails />
        <Gallery />
        <LoveStory />
        <RSVPForm />
      </main>
      <Footer />
    </>
  );
}
