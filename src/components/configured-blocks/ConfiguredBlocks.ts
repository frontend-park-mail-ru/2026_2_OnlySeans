import './configured-blocks.css';
import templateSource from './ConfiguredBlocks.hbs';
import { Component } from '../../core/component.js';
import { loadAssets } from '../../core/assets.js';
import { Button } from '../button/Button.js';
import { CollectionCard } from '../collection-card/CollectionCard.js';
import type { getCollections } from '../../api/collections.js';
import type { HomeBlock } from '../../configured-ui/home-blocks.js';

const template = await loadAssets({ template: templateSource });

type Collection = Awaited<ReturnType<typeof getCollections>>[number];
type Block = Extract<HomeBlock, { type: 'banner' }> | { type: 'collection'; collection: Collection };

export class ConfiguredBlocks extends Component<{ blocks: Block[] }> {
  static template = template;

  context() {
    return { blocks: this.props.blocks.map((block) => ({ ...block, banner: block.type === 'banner' })) };
  }

  onRender() {
    this.findAll('[data-block]').forEach((element, index) => {
      const block = this.props.blocks[index];
      if (block.type === 'collection') {
        const collection = block.collection;
        this.insert(element, new CollectionCard({ ...collection, href: `/collections/${collection.id}` }));
      } else if (block.action) {
        this.insert(element.querySelector('[data-action]'), new Button({
          text: block.action.label, href: block.action.href,
        }));
      }
    });
  }
}
