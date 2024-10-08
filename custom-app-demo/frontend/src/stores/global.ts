// useLayoutStore.ts
import { defineStore } from "pinia";

// Define the structure of the layout store
interface LayoutStore {
  usersEmail: string;
}

// Create the layout store using Pinia
export const useLayoutStore = defineStore("layoutStore", {
  state: (): LayoutStore => ({
    usersEmail: "",
  }),

  actions: {},
});
