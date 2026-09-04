import { redirect } from 'next/navigation';

// The dashboard has no home of its own: projects are the root of everything
// else. M0's placeholder lived here; /debug kept the health probe.
export default function Home() {
  redirect('/projects');
}
