import axios from "axios";

// ✅ Base URL of your deployed Next.js backend
const BASE_URL = "https://main-admin-dashboard-orpin.vercel.app/api";

// Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Increased timeout
  headers: { "Content-Type": "application/json" },
});

// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);

      if (error.response.status === 404) {
        console.error("Resource not found");
      } else if (error.response.status === 401) {
        console.error("Unauthorized access");
      } else if (error.response.status === 409) {
        console.error("Conflict - duplicate request");
      } else if (error.response.status === 500) {
        console.error("Server error");
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    return Promise.reject(error);
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

export type VisitRequestType = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  plotId: string;
  clerkId?: string;
};

export type VisitRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  qrCode: string | null;
  expiresAt: string | null;
  plot: {
    id: string;
    title: string;
    location: string;
    project: {
      id: string;
      name: string;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: "GUEST" | "CLIENT" | "MANAGER";
  } | null;
  createdAt: string;
  updatedAt: string;
};

// Add new type for webhook user data
export type WebhookUserData = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: {
    emailAddress: string;
    verification: {
      status: string;
    };
  }[];
  phoneNumbers: {
    phoneNumber: string;
    verification: {
      status: string;
    };
  }[];
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
  lastSignInAt: number;
  publicMetadata: {
    role?: "GUEST" | "CLIENT" | "MANAGER";
    // Add any other metadata you store
  };
};

// Create or update user
export const createOrUpdateUser = async (user: UserType) => {
  try {
    const res = await api.post("/users", user);
    return res.data;
  } catch (error) {
    console.error("Failed to create/update user:", error);
    throw new Error("User sync failed");
  }
};

export const getProjects = async (): Promise<ProjectType[]> => {
  try {
    const res = await api.get("/projects");
    return res.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
};

export const getPlotsByProjectId = async (
  projectId: string
): Promise<PlotType[]> => {
  try {
    const res = await api.get(`/plots?projectId=${projectId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching plots:", error);
    return [];
  }
};

export const getAllPlots = async (): Promise<PlotType[]> => {
  try {
    const projects = await getProjects();
    const plotPromises = projects.map((p) => getPlotsByProjectId(p.id));
    const allPlots = await Promise.all(plotPromises);
    return allPlots.flat();
  } catch (error) {
    console.error("Error fetching all plots:", error);
    return [];
  }
};

export const getPlotById = async (id: string): Promise<PlotType | null> => {
  try {
    const res = await api.get(`/plots/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching plot:", error);
    return null;
  }
};

export const submitVisitRequest = async (data: VisitRequestType) => {
  try {
    console.log("Submitting visit request:", data);

    // Validate data before sending
    if (!data.name?.trim()) {
      throw new Error("Name is required");
    }
    if (!data.email?.trim()) {
      throw new Error("Email is required");
    }
    if (!data.phone?.trim()) {
      throw new Error("Phone number is required");
    }
    if (!data.date) {
      throw new Error("Date is required");
    }
    if (!data.time?.trim()) {
      throw new Error("Time is required");
    }
    if (!data.plotId?.trim()) {
      throw new Error("Plot ID is required");
    }

    const res = await api.post("/visit-requests", data);
    console.log("Visit request response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Submit visit request error:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error("Please login to book a visit");
      } else if (error.response?.status === 404) {
        throw new Error("Plot not found");
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || "Invalid request data");
      } else if (error.response?.status === 409) {
        throw new Error(
          "You already have a pending visit request for this plot"
        );
      } else if (error.response?.status === 500) {
        throw new Error("Server error. Please try again later");
      }
      throw new Error(
        error.response?.data?.error || "Failed to submit visit request"
      );
    }

    throw new Error(
      "Failed to submit visit request. Please check your connection and try again"
    );
  }
};

// Get visit requests for a specific user
export const getVisitRequests = async (
  clerkId?: string
): Promise<VisitRequest[]> => {
  try {
    const params = new URLSearchParams();
    if (clerkId) {
      params.append("clerkId", clerkId);
    }

    const url = params.toString()
      ? `/visit-requests?${params.toString()}`
      : "/visit-requests";
    console.log("Fetching visit requests from:", url);

    const res = await api.get(url);
    console.log("Visit requests response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching visit requests:", error);

    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 401:
          throw new Error("Please sign in to view your bookings");
        case 404:
          throw new Error("No bookings found");
        case 500:
          throw new Error("Failed to load bookings. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to load bookings"
          );
      }
    }

    throw new Error("Failed to load bookings");
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
    console.error("Error fetching user profile:", error);
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 404:
          throw new Error("User profile not found");
        case 401:
          throw new Error("Unauthorized access");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(
            error.response?.data?.error || "Failed to load profile"
          );
      }
    }
    throw new Error("Failed to load profile");
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
  const res = await fetch(
    `https://main-admin-dashboard-git-main-realtos-projects.vercel.app/api/lands/by-plot?plotId=${plotId}`
  );
  if (!res.ok) throw new Error("Failed to fetch lands");
  return await res.json();
};

export const getOwnedLands = async (clerkId: string) => {
  const response = await fetch(
    `https://main-admin-dashboard-git-main-realtos-projects.vercel.app/api/owned-lands?clerkId=${clerkId}`
  );
  if (!response.ok) throw new Error("Failed to fetch owned lands");
  return await response.json();
};

export const getUserByClerkId = async (clerkId: string) => {
  const res = await fetch(
    `https://main-admin-dashboard-git-main-realtos-projects.vercel.app/api/users?clerkId=${clerkId}`
  );
  if (!res.ok) throw new Error("Failed to fetch user");
  return await res.json();
};

export const updateUserProfile = async (clerkId: string, data: any) => {
  const res = await fetch(
    `https://main-admin-dashboard-git-main-realtos-projects.vercel.app/api/users?clerkId=${clerkId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error("Failed to update profile");
  return await res.json();
};
