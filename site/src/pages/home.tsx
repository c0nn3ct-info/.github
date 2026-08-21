import { useState } from 'react';
import { Hero } from '@/components/hero';
import { Marquee } from '@/components/marquee';
import { Practices } from '@/components/practices';
import { Promises } from '@/components/promises';
import { Talk } from '@/components/talk';
import { Work, type Project } from '@/components/work';
import { useSectionEntrance } from '@/lib/use-enter';
import { useIdleLoops } from '@/lib/use-loops';
import { Layout } from '../layout';

export function HomePage() {
  // The hero index and the work rail are two handles on the same choice, so it
  // lives above both of them.
  const [project, setProject] = useState<Project>('noctis');
  // The workshop pane brings two more loops with it, so the set is gathered
  // again whenever the open product changes.
  useIdleLoops(project);
  // The hero owns the load; every section below it arrives as it comes up.
  useSectionEntrance();
  return (
    <Layout home>
      <main className="flex-1">
        <Hero onPick={setProject} />
        <Marquee />
        <Work project={project} onPick={setProject} />
        <Practices />
        <Promises />
        <Talk />
      </main>
    </Layout>
  );
}
