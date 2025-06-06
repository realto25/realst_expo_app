// import { useCallback, useEffect, useState } from "react";

// export const fetchAPI = async (url: string, options?: RequestInit) => {
//   try {
//     const response = await fetch(url, options);
//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || `HTTP error! status: ${response.status}`);
//     }

//     return data;
//   } catch (error) {
//     console.error("Fetch error:", error);
//     throw error;
//   }
// };

// export const useFetch = <T>(url: string, options?: RequestInit) => {
//   const [data, setData] = useState<T | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const result = await fetchAPI(url, options);
//       setData(result.data || result);
//     } catch (err) {
//       setError((err as Error).message);
//       console.error("Fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, [url, options]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   return { data, loading, error, refetch: fetchData };
// };
