<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <img src="/favicon.png" alt="Logo" class="w-16 h-16 mb-6" />
    <h1 class="text-4xl font-bold text-gray-800 mb-4">FastJobOn</h1>
    <p class="text-lg text-gray-600 mb-2">Einfaches Onboarding für Mini Jobs</p>
    <p class="text-md text-gray-700">Aktiver Benutzer: {{ user?.email }}</p>

    <div class="w-2/3 mt-10 mb-10bg-white p-10 rounded-lg shadow-md m-auto">
      <GenericForm :definition="userFormConfiguration" v-model="demoData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { fetcher } from "@/devkit/services/fetch";
import type { GenericFormEntry } from "@/formbuilder/types/generic-form";
import { onMounted, ref } from "vue";
import * as v from "valibot";
import GenericForm from "@/formbuilder/components/GenericForm.vue";

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
    type: "password",
    label: "Password",
    key: "password",
    required: true,
    settings: {
      placeholder: "Create a password",
      width: "100%",
    },
    validation: v.pick(userFormConfigurationValidation, ["password"]),
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
</script>
