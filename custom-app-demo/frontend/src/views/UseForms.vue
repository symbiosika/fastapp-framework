<template>
  <WebsiteLayoutWrapper
    title="DevKit - Formbuilder"
    description="Formulare aus JSON definieren, mittels Valibot validieren und mit PrimeVue
      darstellen."
  >
    <div class="mt-10 mb-10bg-white p-10 rounded-lg shadow-md m-auto">
      <GenericForm :definition="userFormConfiguration" v-model="demoData" />
    </div>
    <div class="flex justify-center mt-3 mb-5 w-1/3">
      <Button label="Submit" class="w-full" />
    </div>

    <pre
      class="mt-5 p-4 bg-gray-100 rounded-lg overflow-auto max-w-full text-left mb-5"
    >
      <br />{{ JSON.stringify(demoData, null, 2) }}
    </pre>

    <pre
      class="mt-5 p-4 bg-gray-100 rounded-lg overflow-auto max-w-full text-left mb-5"
    >
    <br />{{ userFormConfigurationWithoutValidation }}
    </pre>
  </WebsiteLayoutWrapper>
</template>

<script setup lang="ts">
import { fetcher } from "@/devkit/services/fetch";
import Button from "primevue/button";
import type { GenericFormEntry } from "@/formbuilder/types/generic-form";
import { computed, onMounted, ref } from "vue";
import * as v from "valibot";
import GenericForm from "@/formbuilder/components/GenericForm.vue";
import WebsiteLayoutWrapper from "@/views/WebsiteLayoutWrapper.vue";

const user = ref(<any>null);
const demoData = ref(<any>{});

const getSomeData = async () => {
  const data = await fetcher.get("/api/v1/user/me");
  user.value = data;
};

onMounted(async () => {
  await getSomeData();
});

const userFormConfigurationValidation = v.object({
  firstName: v.string(),
  lastName: v.string(),
  email: v.pipe(v.string(), v.email()),
  password: v.string(),
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
  birthDate: v.string(),
  favoriteColor: v.string(),
  bio: v.string(),
  gender: v.string(),
  hobbies: v.array(v.string()),
  newsletter: v.boolean(),
  satisfaction: v.number(),
  secretQuestion: v.string(),
  secretAnswer: v.string(),
});

const userFormConfiguration: GenericFormEntry[] = [
  {
    type: "section-header",
    header: "Personal Information",
  },
  {
    type: "two-col-layout",
    childs: [
      {
        type: "text",
        label: "First Name",
        key: "firstName",
        required: true,
        settings: {
          placeholder: "Enter your first name",
          width: "100%",
          bold: true,
        },
        validation: v.pick(userFormConfigurationValidation, ["firstName"]),
      },
      {
        type: "text",
        label: "Last Name",
        key: "lastName",
        required: true,
        settings: {
          placeholder: "Enter your last name",
          width: "100%",
        },
        validation: v.pick(userFormConfigurationValidation, ["lastName"]),
      },
    ],
  },
  {
    type: "text",
    label: "Email Address",
    key: "email",
    required: true,
    settings: {
      placeholder: "Enter your email",
      width: "100%",
    },
    validation: v.pick(userFormConfigurationValidation, ["email"]),
  },
  {
    type: "number",
    label: "Age",
    key: "age",
    settings: {
      min: 0,
      max: 120,
      width: "50%",
    },
    validation: v.pick(userFormConfigurationValidation, ["age"]),
  },
  {
    type: "date",
    label: "Birth Date",
    key: "birthDate",
    required: true,
  },
  {
    type: "color",
    label: "Favorite Color",
    key: "favoriteColor",
    validation: v.pick(userFormConfigurationValidation, ["favoriteColor"]),
  },
  {
    type: "textarea",
    label: "Bio",
    key: "bio",
    settings: {
      showReWrite: true,
    },
  },
  {
    type: "horizontal-line",
  },
  {
    type: "section-header",
    header: "Preferences",
  },
  {
    type: "radio",
    label: "Gender",
    key: "gender",
    required: true,
    options: [
      { key: "M", name: "Male" },
      { key: "F", name: "Female" },
      { key: "O", name: "Other" },
    ],
    optionsKey: "key",
    optionsLabel: "name",
    validation: v.pick(userFormConfigurationValidation, ["gender"]),
  },
  {
    type: "multi-select",
    label: "Hobbies",
    key: "hobbies",
    options: ["Reading", "Traveling", "Gaming", "Cooking"],
    optionsType: "string",
    validation: v.pick(userFormConfigurationValidation, ["hobbies"]),
    settings: {
      placeholder: "Select your hobbies",
    },
  },
  {
    type: "checkbox",
    label: "Subscribe to Newsletter",
    key: "newsletter",
    tooltip: "Get updates and offers",
    validation: v.pick(userFormConfigurationValidation, ["newsletter"]),
  },
  {
    type: "slider",
    label: "Satisfaction Level",
    key: "satisfaction",
    settings: {
      min: 0,
      max: 10,
      step: 1,
    },
    validation: v.pick(userFormConfigurationValidation, ["satisfaction"]),
  },
  {
    type: "section-header",
    header: "Security Questions",
  },
  {
    type: "select",
    label: "Secret Question",
    key: "secretQuestion",
    options: [
      { id: 1, question: "What is your mother's maiden name?" },
      { id: 2, question: "What was your first pet's name?" },
      { id: 3, question: "What was the name of your first school?" },
    ],
    optionsKey: "id",
    optionsLabel: "question",
    optionsType: "object",
    required: true,
    settings: {
      placeholder: "Select a secret question",
    },
  },
  {
    type: "text",
    label: "Secret Answer",
    key: "secretAnswer",
    required: true,
    settings: {
      placeholder: "Enter your secret answer",
    },
    hide: [
      {
        key: "secretQuestion",
        operator: "eq",
        value: null,
      },
    ],
    validation: v.pick(userFormConfigurationValidation, ["secretAnswer"]),
  },
];

const userFormConfigurationWithoutValidation = computed(() => {
  const removeValidation = (entry: any): any => {
    if (Array.isArray(entry)) {
      return entry.map(removeValidation);
    }
    if (typeof entry === "object" && entry !== null) {
      const newEntry = { ...entry };
      delete newEntry.validation;
      if (newEntry.childs) {
        newEntry.childs = newEntry.childs.map(removeValidation);
      }
      return newEntry;
    }
    return entry;
  };

  return removeValidation(userFormConfiguration);
});
</script>
