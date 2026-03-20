// Root tRPC router — merges all domain routers into one typed API
// Procedures are called as: trpc.ingredient.getAll.useQuery(...)
import { router } from "../trpc";
import { ingredientRouter } from "./ingredient";
import { recipeRouter } from "./recipe";
import { wasteRouter } from "./waste";
import { analyticsRouter } from "./analytics";

export const appRouter = router({
  ingredient: ingredientRouter, // Pantry ingredient CRUD + stock adjustments
  recipe:     recipeRouter,     // Product CRUD + BOM ingredient management
  waste:      wasteRouter,      // End-of-day bake/waste logging
  analytics:  analyticsRouter,  // Demand forecast, waste analytics, KPIs
});

// Shared type for end-to-end type safety between server and client
export type AppRouter = typeof appRouter;
