// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//   // Fails loudly at build/runtime rather than silently returning null data.
//   console.warn(
//     'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY - copy .env.local.example to .env.local'
//   );
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   realtime: {
//     params: {
//       eventsPerSecond: 20, // auction bidding is bursty - keep the socket responsive
//     },
//   },
// });





import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder strings during Vercel's static build step
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY - check Vercel Environment Variables'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20, 
    },
  },
});