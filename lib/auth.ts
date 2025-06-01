// // import * as Linking from "expo-linking";
// // import * as SecureStore from "expo-secure-store";

// import { fetchAPI } from "@/lib/fetch";

// // export const tokenCache = {
// //   async getToken(key: string) {
// //     try {
// //       const item = await SecureStore.getItemAsync(key);
// //       if (item) {
// //         console.log(`${key} was used 🔐 \n`);
// //       } else {
// //         console.log("No values stored under key: " + key);
// //       }
// //       return item;
// //     } catch (error) {
// //       console.error("SecureStore get item error: ", error);
// //       await SecureStore.deleteItemAsync(key);
// //       return null;
// //     }
// //   },
// //   async saveToken(key: string, value: string) {
// //     try {
// //       return SecureStore.setItemAsync(key, value);
// //     } catch (err) {
// //       return;
// //     }
// //   },
// // };

// // export const googleOAuth = async (startOAuthFlow: any) => {
// //   try {
// //     const { createdSessionId, setActive, signUp } = await startOAuthFlow({
// //       redirectUrl: Linking.createURL("/(guest)/(tabs)/home"),
// //     });

// //     if (createdSessionId) {
// //       if (setActive) {
// //         await setActive({ session: createdSessionId });

// //         if (signUp.createdUserId) {
// //           await fetchAPI("/(api)/user", {
// //             method: "POST",
// //             body: JSON.stringify({
// //               name: `${signUp.firstName} ${signUp.lastName}`,
// //               email: signUp.emailAddress,
// //               clerkId: signUp.createdUserId,
// //             }),
// //           });
// //         }

// //         return {
// //           success: true,
// //           code: "success",
// //           message: "You have successfully signed in with Google",
// //         };
// //       }
// //     }

// //     return {
// //       success: false,
// //       message: "An error occurred while signing in with Google",
// //     };
// //   } catch (err: any) {
// //     console.error(err);
// //     return {
// //       success: false,
// //       code: err.code,
// //       message: err?.errors[0]?.longMessage,
// //     };
// //   }
// // };

// export const createUserInDatabase = async (userData: {
//   clerkId: string;
//   email: string;
//   name: string;
//   role: "GUEST" | "CLIENT" | "MANAGER";
//   phone?: string;
// }) => {
//   try {
//     const response = await fetchAPI("/(api)/user", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(userData),
//     });

//     if (!response.success) {
//       throw new Error(response.message || "Failed to create user");
//     }

//     return response.data;
//   } catch (error) {
//     console.error("Error creating user:", error);
//     throw error;
//   }
// };

// export const updateUserMetadata = async (clerkId: string, metadata: any) => {
//   try {
//     const response = await fetchAPI("/(api)/user/metadata", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ clerkId, metadata }),
//     });

//     if (!response.success) {
//       throw new Error(response.message || "Failed to update metadata");
//     }

//     return response.data;
//   } catch (error) {
//     console.error("Error updating metadata:", error);
//     throw error;
//   }
// };
