import { employeeProfileAPI } from "../utils/api.js";

export const DEFAULT_PROFILE = {
  avatar: "",
  emergencyContacts: [],
  dependents: [],
  bank: { bankName: "", accountName: "", accountNumber: "" },
  education: [],
  promotions: [],
  customFields: [],
  skills: "",
};

export function normalizeProfile(rawProfile = {}) {
  const profile = { ...DEFAULT_PROFILE, ...rawProfile };
  profile.emergencyContacts = Array.isArray(rawProfile.emergencyContacts)
    ? rawProfile.emergencyContacts.map((item) => ({
        name: item?.name || "",
        phone: item?.phone || "",
        relation: item?.relation || "",
      }))
    : [];
  profile.dependents = Array.isArray(rawProfile.dependents)
    ? rawProfile.dependents.map((item) => ({
        name: item?.name || "",
        relation: item?.relation || "",
        dob: item?.dob || "",
      }))
    : [];
  profile.education = Array.isArray(rawProfile.education)
    ? rawProfile.education.map((item) => ({
        title: item?.title || "",
        school: item?.school || "",
        year: item?.year || "",
      }))
    : [];
  profile.promotions = Array.isArray(rawProfile.promotions)
    ? rawProfile.promotions.map((item) => ({
        title: item?.title || "",
        date: item?.date || "",
        note: item?.note || "",
      }))
    : [];
  profile.customFields = Array.isArray(rawProfile.customFields)
    ? rawProfile.customFields.map((item) => ({
        key: item?.key || "",
        value: item?.value || "",
      }))
    : [];
  profile.bank = {
    bankName: rawProfile?.bank?.bankName || "",
    accountName: rawProfile?.bank?.accountName || "",
    accountNumber: rawProfile?.bank?.accountNumber || "",
  };
  profile.skills = rawProfile.skills || "";
  profile.avatar = rawProfile.avatar || "";
  return profile;
}

export async function loadProfile(employeeId) {
  try {
    const response = await employeeProfileAPI.get(employeeId);
    return normalizeProfile(response.data || {});
  } catch (error) {
    return normalizeProfile();
  }
}

export async function saveProfile(employeeId, profile) {
  const normalized = normalizeProfile(profile);
  try {
    await employeeProfileAPI.update(employeeId, normalized);
  } catch (error) {
    console.error("Failed to save profile:", error);
    throw error;
  }
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

