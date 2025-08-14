import {
  type RenderBlockContext,
  type RenderNodeContext,
  UmbracoRichText,
} from '@charlietango/umbraco-rich-text';

// replace with ApiBlockItemModel from your own Umbraco API openapi docs for type safety
interface ApiBlockItemModel {
  content: {
    id: 'youtube';
    properties: {
      videoId: string;
    };
  };
}

declare module '@charlietango/umbraco-rich-text' {
  interface UmbracoBlockItemModel extends ApiBlockItemModel {}
}

// provide custom rendering for specific DOM elements
function renderNode({
  tag,
  attributes,
  children,
}: RenderNodeContext): React.ReactNode | undefined {
  // discriminating on the tag name ensures correct typing for attributes
  switch (tag) {
    case 'img': {
      return <img alt="" {...attributes} loading="lazy" />;
    }
    case 'p':
      return <p {...attributes}>{children}</p>;
  }
  // fallback to default rendering when undefined is returned
}

function exhaustiveGuard(value: never): never {
  throw new Error(`Non-exhaustive switch, ${value} is not handled`);
}

// provide handling of rendering blocks from Umbraco
function renderBlock({
  content,
}: RenderBlockContext): React.ReactNode | undefined {
  if (!content) return undefined;

  // discriminating on content.id ensures correct typing for the content properties based on the defined ApiBlockItemModel
  switch (content.id) {
    case 'youtube':
      return (
        <a
          title="Play"
          className="relative group"
          href={`https://www.youtube.com/watch?v=${content.properties.videoId}`}
          target="_blank"
        >
          <figure className="group-hover:scale-125 transition z-10 text-white bg-red-500 block w-9 h-7 rounded-md text-center absolute top-1/2 left-1/2 m-0 -translate-x-1/2 -translate-y-1/2">
            ▶
          </figure>
          <img
            alt=""
            className="rounded-xl"
            src={`https://i.ytimg.com/vi/${content.properties.videoId}/hq720.jpg`}
          />
        </a>
      );
    default:
      // utilize an exhaustive guard to ensure that all block types are handled
      return exhaustiveGuard(content.id);
  }
}

function RichText(props: { data: any }) {
  return (
    <div className="prose">
      <UmbracoRichText
        data={props.data}
        renderNode={renderNode}
        renderBlock={renderBlock}
      />
    </div>
  );
}

export default RichText;
