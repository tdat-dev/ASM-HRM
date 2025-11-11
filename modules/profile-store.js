import { employeeProfileAPI } from "../utils/api.js";
import { logger } from "../utils/logger.js";

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

// Batch load profiles to avoid N+1 in callers.
// Tries backend batch endpoint; falls back to per-ID in parallel if not available.
export async function loadProfiles(employeeIds = []) {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    return new Map();
  }
  try {
    const response = await employeeProfileAPI.getMany(employeeIds);
    const list = Array.isArray(response.data) ? response.data : [];
    const map = new Map();
    list.forEach((raw) => {
      const id = raw?.employee_id ?? raw?.employeeId;
      if (id != null) {
        map.set(Number(id), normalizeProfile(raw));
      }
    });
    // If backend returned fewer items than requested, fill missing with defaults
    employeeIds.forEach((id) => {
      const key = Number(id);
      if (!map.has(key)) {
        map.set(key, normalizeProfile());
      }
    });
    return map;
  } catch (error) {
    logger.warn("profile_batch_fallback", {
      message: error?.message || "batch endpoint unavailable",
      requested: employeeIds.length,
    });
    // Fallback: parallel fetch
    const results = await Promise.allSettled(
      employeeIds.map((id) => employeeProfileAPI.get(id))
    );
    const map = new Map();
    results.forEach((res, idx) => {
      const id = Number(employeeIds[idx]);
      if (res.status === "fulfilled") {
        map.set(id, normalizeProfile(res.value?.data || {}));
      } else {
        map.set(id, normalizeProfile());
      }
    });
    return map;
  }
}

export async function saveProfile(employeeId, profile) {
  const normalized = normalizeProfile(profile);
  try {
    await employeeProfileAPI.update(employeeId, normalized);
  } catch (error) {
    logger.error("profile_save_failed", { employeeId, message: error?.message || "unknown" });
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

