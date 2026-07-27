import { getRestaurantLanding } from "@/services/landing";
import type { RestaurantLanding } from "@/services/landing";
import { LandingTopBar } from "@/components/layout/landing-topbar";
import { PremiumLandingHero } from "./premium-landing-hero";
import { PremiumLandingCatalog } from "./premium-landing-catalog";
import { PremiumLandingStory } from "./premium-landing-story";
import { PremiumLandingProof } from "./premium-landing-proof";

type PremiumLandingPageProps = {
  landing?: RestaurantLanding;
};

export async function PremiumLandingPage({ landing: providedLanding }: PremiumLandingPageProps = {}) {
  const landing = providedLanding ?? (await getRestaurantLanding());

  return (
    <main className="relative overflow-hidden">
      <LandingTopBar restaurantName={landing.restaurant.name} />
      <PremiumLandingHero hero={landing.hero} stats={landing.stats} />
      <PremiumLandingCatalog
        categories={landing.featuredCategories}
        featuredProducts={landing.featuredProducts}
        promotionalProducts={landing.promotionalProducts}
        contact={landing.contact}
      />
      <PremiumLandingStory landing={landing} />
      <PremiumLandingProof gallery={landing.gallery} contact={landing.contact} restaurant={landing.restaurant} />
    </main>
  );
}
