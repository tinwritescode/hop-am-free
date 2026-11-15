import Link from "next/link";
import { Fragment } from "react";
import { DEFAULT_QUERY, hrefWith } from "@/lib/song-list";

/** Each singer as a link to the list of their songs, comma separated. */
export function ArtistLinks({ artists, className }: { artists: readonly string[]; className: string }) {
  return artists.map((name, i) => (
    <Fragment key={name}>
      {i > 0 && ", "}
      <Link href={hrefWith(DEFAULT_QUERY, { artist: name })} className={className}>
        {name}
      </Link>
    </Fragment>
  ));
}
