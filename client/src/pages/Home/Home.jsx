import Navbar from "../../components/layout/Navbar/Navbar";
import Hero from "../../components/home/Hero/Hero";
import Categories from "../../components/home/Categories/Categories";
import NewArrivals from "../../components/products/NewArrivals/NewArrivals";
import FeaturedCollection from "../../components/home/FeaturedCollection/FeaturedCollection";
import BestSellers from "../../components/home/BestSellers/BestSellers";
import BrandStory from "../../components/home/BrandStory/BrandStory";
import Newsletter from "../../components/home/Newsletter/Newsletter";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Categories />
        <NewArrivals />
        <FeaturedCollection />
        <BestSellers />
        <BrandStory />
        <Newsletter />
      </main>
    </>
  );
}

export default Home;