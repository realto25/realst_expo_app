import { tokenCache } from "@clerk/clerk-expo/token-cache";
import axios from "axios";

// API Configuration
const API_CONFIG = {
  BASE_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    "https://main-admin-dashboard-orpin.vercel.app/api",
  TIMEOUT: 15000,
  ENDPOINTS: {
    AUTH: {
      PROFILE: "/users/profile",
      WEBHOOK_PROFILE: (clerkId: string) => `/users/${clerkId}/profile`,
      UPDATE_PROFILE: "/users",
    },
    BOOKINGS: {
      CREATE: "/bookings",
      LIST: "/bookings",
      DETAILS: (id: string) => `/bookings/${id}`,
    },
    PROJECTS: {
      LIST: "/projects",
      DETAILS: (id: string) => `/projects/${id}`,
    },
    PLOTS: {
      LIST: "/plots",
      DETAILS: (id: string) => `/plots/${id}`,
      BY_PROJECT: (projectId: string) => `/plots?projectId=${projectId}`,
    },
    FEEDBACK: {
      CREATE: "/feedback",
      LIST: "/feedback",
    },
    CAMERAS: {
      LIST: "/cameras",
      CREATE: "/cameras",
      UPDATE: (id: string) => `/cameras/${id}`,
      DELETE: (id: string) => `/cameras/${id}`,
    },
    LANDS: {
      BY_PLOT: "/lands/by-plot",
      OWNED: "/owned-lands",
    },
  },
} as const;

// Axios instance with proper configuration
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Add auth token if available
      const token = await tokenCache?.getToken("default");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return config; // Continue without token if there's an error
    }
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      console.error("Network error:", error.message);
      return Promise.reject(new Error("Please check your internet connection"));
    }

    const { status, data } = error.response;
    console.error("API Error:", {
      status,
      data,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Handle specific status codes
    switch (status) {
      case 400:
        return Promise.reject(new Error(data?.error || "Invalid request"));
      case 401:
        return Promise.reject(new Error("Please sign in to continue"));
      case 403:
        return Promise.reject(
          new Error("You don't have permission for this action")
        );
      case 404:
        return Promise.reject(new Error("Resource not found"));
      case 409:
        return Promise.reject(
          new Error("This action conflicts with existing data")
        );
      case 500:
        return Promise.reject(
          new Error("Server error. Please try again later")
        );
      default:
        return Promise.reject(new Error(data?.error || "Something went wrong"));
    }
  }
);

export type UserType = {
  clerkId: string;
  email: string;
  name: string;
  phone?: string;
  role?: "GUEST" | "CLIENT" | "MANAGER";
};

export type ProjectType = {
  id: string;
  name: string;
  city: string;
  description: string;
  imageUrl: string;
  rating: number;
  plotsAvailable: number;
  priceRange: string;
  location: string;
  amenities: string[];
};

export type PlotType = {
  id: string;
  title: string;
  dimension: string;
  price: number;
  priceLabel: string;
  status: string;
  imageUrls: string[];
  location: string;
  latitude: number;
  longitude: number;
  facing: string;
  amenities: string[];
  mapEmbedUrl: string;
  projectId: string;
  createdAt: string;
};

// Types for visit requests
export type VisitRequestStatus = "PENDING" | "ASSIGNED" | "APPROVED" | "REJECTED";

export interface VisitRequestType {
  id?: string;
  status: VisitRequestStatus;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  plotId: string;
  userId?: string;
  qrCode?: string | null;
  expiresAt?: string | null;
  title?: string;
  projectName?: string;
  plotNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  plot?: {
    id: string;
    title: string;
    location: string;
    projectId: string;
    project?: {
      id: string;
      name: string;
    };
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    clerkId: string;
  };
  assignedManager?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    clerkId: string;
  } | null;
  rejectionReason?: string | null;
}

// Visit Request API functions
export const submitVisitRequest = async (data: Omit<VisitRequestType, "status" | "id">): Promise<VisitRequestType> => {
  try {
    // Validate required fields
    if (!data.name?.trim()) throw new Error("Name is required");
    if (!data.email?.trim()) throw new Error("Email is required");
    if (!data.phone?.trim()) throw new Error("Phone number is required");
    if (!data.date) throw new Error("Date is required");
    if (!data.time?.trim()) throw new Error("Time is required");
    if (!data.plotId?.trim()) throw new Error("Plot ID is required");

    const res = await api.post(API_CONFIG.ENDPOINTS.BOOKINGS.CREATE, {
      data: {
        ...data,
        status: "PENDING",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error submitting visit request:", error);
    throw error;
  }
};

export const getVisitRequests = async (params?: { 
  clerkId?: string;
  userId?: string;
  getManagers?: boolean;
  role?: string;
}): Promise<VisitRequestType[]> => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.clerkId) searchParams.append("clerkId", params.clerkId);
    if (params?.userId) searchParams.append("userId", params.userId);
    if (params?.getManagers) searchParams.append("getManagers", "true");
    if (params?.role) searchParams.append("role", params.role);

    const res = await api.get(`${API_CONFIG.ENDPOINTS.BOOKINGS.LIST}?${searchParams.toString()}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching visit requests:", error);
    throw error;
  }
};

export const acceptVisitRequest = async (
  requestId: string,
  data: {
    clerkId: string;
    plotId: string;
    visitorName: string;
    visitDate: string;
    visitTime: string;
  }
): Promise<VisitRequestType> => {
  try {
    const res = await api.post(`${API_CONFIG.ENDPOINTS.BOOKINGS.DETAILS(requestId)}/accept`, data);
    return res.data;
  } catch (error) {
    console.error("Error accepting visit request:", error);
    throw error;
  }
};

export const rejectVisitRequest = async (
  requestId: string,
  data: {
    clerkId: string;
    reason: string;
  }
): Promise<VisitRequestType> => {
  try {
    const res = await api.post(`${API_CONFIG.ENDPOINTS.BOOKINGS.DETAILS(requestId)}/reject`, data);
    return res.data;
  } catch (error) {
    console.error("Error rejecting visit request:", error);
    throw error;
  }
};

export const assignManagerToVisitRequest = async (
  requestId: string,
  managerClerkId: string
): Promise<VisitRequestType> => {
  try {
    const res = await api.patch(API_CONFIG.ENDPOINTS.BOOKINGS.DETAILS(requestId), {
      id: requestId,
      managerClerkId,
    });
    return res.data;
  } catch (error) {
    console.error("Error assigning manager:", error);
    throw error;
  }
};

// Updated FeedbackType and submitFeedback function for your API client

export type FeedbackType = {
  visitRequestId: string;
  rating: number;
  experience: string;
  suggestions: string;
  purchaseInterest: boolean | null;
  clerkId: string;
};

export const submitFeedback = async (data: FeedbackType) => {
  try {
    // Validate data
    if (!data.visitRequestId?.trim()) {
      throw new Error("Visit Request ID is required");
    }
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    if (!data.experience?.trim()) {
      throw new Error("Experience feedback is required");
    }
    if (!data.suggestions?.trim()) {
      throw new Error("Suggestions are required");
    }
    if (!data.clerkId?.trim()) {
      throw new Error("User ID is required");
    }

    const feedbackData = {
      visitRequestId: data.visitRequestId,
      rating: Number(data.rating),
      experience: data.experience.trim(),
      suggestions: data.suggestions.trim(),
      purchaseInterest: data.purchaseInterest,
      clerkId: data.clerkId,
    };

    const res = await api.post("/feedback", feedbackData);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 400:
          throw new Error(
            error.response.data?.error || "Invalid feedback data"
          );
        case 401:
          throw new Error("Please sign in to submit feedback");
        case 404:
          throw new Error("Visit request or user not found");
        case 409:
          throw new Error("Feedback already submitted for this visit");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to submit feedback"
          );
      }
    }
    throw new Error("Failed to submit feedback");
  }
};

// Remove both existing getUserProfile functions and replace with this single one
export const getUserProfile = async (
  clerkId: string
): Promise<WebhookUserData> => {
  try {
    // First try to get webhook data
    const webhookRes = await api.get(`/users/${clerkId}/profile`);

    // If webhook endpoint fails, fall back to regular profile endpoint
    if (!webhookRes.data) {
      const profileRes = await api.get(`/users/profile?clerkId=${clerkId}`);
      return {
        id: clerkId,
        firstName: profileRes.data.name?.split(" ")[0] || null,
        lastName: profileRes.data.name?.split(" ").slice(1).join(" ") || null,
        emailAddresses: [
          {
            emailAddress: profileRes.data.email,
            verification: { status: "verified" },
          },
        ],
        phoneNumbers: profileRes.data.phone
          ? [
              {
                phoneNumber: profileRes.data.phone,
                verification: { status: "verified" },
              },
            ]
          : [],
        imageUrl: profileRes.data.imageUrl || "",
        createdAt: new Date(profileRes.data.createdAt).getTime(),
        updatedAt: new Date(profileRes.data.updatedAt).getTime(),
        lastSignInAt: new Date(
          profileRes.data.lastSignInAt || profileRes.data.updatedAt
        ).getTime(),
        publicMetadata: {
          role: profileRes.data.role,
        },
      };
    }

    return webhookRes.data;
  } catch (error) {
    // Instead of throwing errors, return a basic profile
    console.log("Using basic profile data for user:", clerkId);

    // Return a basic profile with the available Clerk data
    return {
      id: clerkId,
      firstName: null,
      lastName: null,
      emailAddresses: [],
      phoneNumbers: [],
      imageUrl: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastSignInAt: Date.now(),
      publicMetadata: {
        role: "GUEST",
      },
    };
  }
};

// Get user's feedback history
export const getUserFeedback = async (clerkId: string) => {
  try {
    const res = await api.get(`/feedback?clerkId=${clerkId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching user feedback:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 404:
          throw new Error("No feedback found");
        case 401:
          throw new Error("Unauthorized access");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to load feedback history"
          );
      }
    }
    throw new Error("Failed to load feedback history");
  }
};

export const getLandsByPlotId = async (plotId: string) => {
  try {
    const res = await api.get(`/lands/by-plot`, {
      params: { plotId },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching lands:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 404:
          throw new Error("No lands found");
        case 401:
          throw new Error("Unauthorized access");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to fetch lands"
          );
      }
    }
    throw new Error("Failed to fetch lands");
  }
};

export const getOwnedLands = async (clerkId: string) => {
  try {
    const res = await api.get("/owned-lands", {
      params: { clerkId },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching owned lands:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 404:
          throw new Error("No owned lands found");
        case 401:
          throw new Error("Unauthorized access");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to fetch owned lands"
          );
      }
    }
    throw new Error("Failed to fetch owned lands");
  }
};

export const getUserByClerkId = async (clerkId: string) => {
  try {
    const res = await api.get("/users", {
      params: { clerkId },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 404:
          throw new Error("User not found");
        case 401:
          throw new Error("Unauthorized access");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to fetch user"
          );
      }
    }
    throw new Error("Failed to fetch user");
  }
};

export const updateUserProfile = async (clerkId: string, data: any) => {
  try {
    const res = await api.put("/users", data, {
      params: { clerkId },
    });
    return res.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 400:
          throw new Error(error.response.data?.error || "Invalid profile data");
        case 401:
          throw new Error("Unauthorized access");
        case 404:
          throw new Error("User not found");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to update profile"
          );
      }
    }
    throw new Error("Failed to update profile");
  }
};

// Camera types
export type CameraType = {
  id: string;
  landId: string;
  ipAddress: string;
  label: string;
  createdAt: string;
  land?: {
    id: string;
    plot?: {
      title: string;
      location: string;
    };
  };
};

export type CreateCameraType = {
  landId: string;
  ipAddress: string;
  label: string;
};

export type UpdateCameraType = {
  ipAddress?: string;
  label?: string;
};

// Camera API functions
export const getCameras = async (clerkId: string): Promise<CameraType[]> => {
  try {
    const res = await api.get("/cameras", {
      params: { clerkId },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching cameras:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 401:
          throw new Error("Please sign in to view cameras");
        case 404:
          return [];
        default:
          throw new Error(
            error.response?.data?.error || "Failed to fetch cameras"
          );
      }
    }
    throw new Error("Failed to fetch cameras");
  }
};

export const getCameraById = async (
  id: string,
  clerkId: string
): Promise<CameraType | null> => {
  try {
    const res = await api.get(`/cameras/${id}`, {
      params: { clerkId },
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching camera:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 401:
          throw new Error("Unauthorized access");
        case 404:
          return null;
        default:
          throw new Error(
            error.response?.data?.error || "Failed to fetch camera"
          );
      }
    }
    throw new Error("Failed to fetch camera");
  }
};

export const createOrUpdateCamera = async (
  data: CreateCameraType,
  clerkId: string
): Promise<CameraType> => {
  try {
    // Validate data
    if (!data.landId?.trim()) {
      throw new Error("Land ID is required");
    }
    if (!data.ipAddress?.trim()) {
      throw new Error("IP Address is required");
    }
    if (!data.label?.trim()) {
      throw new Error("Camera label is required");
    }

    const res = await api.post("/cameras", {
      ...data,
      clerkId,
    });
    return res.data;
  } catch (error) {
    console.error("Error creating/updating camera:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 400:
          throw new Error(error.response.data?.error || "Invalid camera data");
        case 401:
          throw new Error("Please sign in to manage cameras");
        case 403:
          throw new Error("You don't have permission for this land");
        case 404:
          throw new Error("Land not found");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to save camera"
          );
      }
    }
    throw new Error("Failed to save camera");
  }
};

export const updateCamera = async (
  id: string,
  data: UpdateCameraType,
  clerkId: string
): Promise<CameraType> => {
  try {
    // Validate data
    if (data.ipAddress && !data.ipAddress.trim()) {
      throw new Error("IP Address is invalid");
    }
    if (data.label && !data.label.trim()) {
      throw new Error("Camera label is invalid");
    }

    const res = await api.patch(`/cameras/${id}`, {
      ...data,
      clerkId,
    });
    return res.data;
  } catch (error) {
    console.error("Error updating camera:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 400:
          throw new Error(error.response.data?.error || "Invalid camera data");
        case 401:
          throw new Error("Please sign in to update cameras");
        case 403:
          throw new Error("You don't have permission for this camera");
        case 404:
          throw new Error("Camera not found");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to update camera"
          );
      }
    }
    throw new Error("Failed to update camera");
  }
};

export const deleteCamera = async (
  id: string,
  clerkId: string
): Promise<void> => {
  try {
    await api.delete(`/cameras/${id}`, {
      params: { clerkId },
    });
  } catch (error) {
    console.error("Error deleting camera:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 401:
          throw new Error("Please sign in to delete cameras");
        case 403:
          throw new Error("You don't have permission for this camera");
        case 404:
          throw new Error("Camera not found");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to delete camera"
          );
      }
    }
    throw new Error("Failed to delete camera");
  }
};

// ... existing functions below ...
