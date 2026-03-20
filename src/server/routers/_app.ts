import { router } from "../trpc";
import { ingredientRouter } from "./ingredient";
import { recipeRouter } from "./recipe";
import { wasteRouter } from "./waste";
import { orderRouter } from "./order";
import { analyticsRouter } from "./analytics";
import { tenantRouter } from "./tenant";

export const appRouter = router({
  ingredient: ingredientRouter,
  recipe: recipeRouter,
  waste: wasteRouter,
  order: orderRouter,
  analytics: analyticsRouter,
  tenant: tenantRouter,
});

export type AppRouter = typeof appRouter;
