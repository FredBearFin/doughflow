import { router } from "../trpc";
import { ingredientRouter } from "./ingredient";
import { recipeRouter } from "./recipe";
import { wasteRouter } from "./waste";
import { orderRouter } from "./order";
import { analyticsRouter } from "./analytics";

export const appRouter = router({
  ingredient: ingredientRouter,
  recipe: recipeRouter,
  waste: wasteRouter,
  order: orderRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
