import { ImageSize } from '@/app/_define/const';
import cytoscape from 'cytoscape';

const style = [
    {
        selector: 'node[name]',
        style: {
            label: 'data(name)',
            "text-valign" : "bottom",
            "text-halign": "center",
            "border-color": 'data(color)',
            "border-width": 5,
            'background-color': 'data(color)',
            'background-image' : 'data(image)',
            width: ImageSize.width,
            height: ImageSize.height,
            shape: 'data(shape)',
            "z-index": 1,
        }
    },
    {
        selector: '.disabled',
        style: {
            opacity: 0.3,
        }
    },
    {
        selector: 'node.neighbor',
        style: {
            "border-color": '#88bb88',
            "z-index": 2,
        }
    },
    // selectedとneighborの両方を持つ場合は、selectedのスタイル優先（loopの場合）
    {
      selector: 'node:selected',
      style: {
          "border-color": '#dd8888',
          "z-index": 3,
      }
    },
    {
        selector: 'edge[sourceArrow]',
        style: {
            "line-color": '#aaa',
            opacity: 0.6,
            'control-point-step-size': 100,
            "source-arrow-shape": "data(sourceArrow)",
            "target-arrow-shape": "data(targetArrow)",
            "curve-style": "bezier",
          }
    },
    {
        selector: 'edge.neighbor',
        style: {
            "line-color": '#f8bc72',
            'source-arrow-color': '#f8bc72',
            'target-arrow-color': '#f8bc72',
            'width': 5,
        }
    },
    {
        selector: '.eh-handle',
        style: {
          'background-color': '#ffaaaa',
          'width': 12,
          'height': 12,
          'shape': 'ellipse',
          'overlay-opacity': 0,
          'border-width': 12, // makes the handle easier to hit
          'border-opacity': 0
        }
    },
    {
        selector: '.eh-hover',
        style: {
          'background-color': '#ffaaaa'
        }
    },

    {
        selector: '.eh-source',
        style: {
          'border-width': 5,
          'border-color': '#ffaaaa'
        }
    },

    {
        selector: '.eh-target',
        style: {
          'border-width': 2,
          'border-color': '#ffaaaa'
        }
    },

    {
        selector: '.eh-preview, .eh-ghost-edge',
        style: {
          'background-color': '#ffaaaa',
          'line-color': '#ffaaaa',
          'target-arrow-color': '#ffaaaa',
          'source-arrow-color': '#ffaaaa'
        }
    },

    {
        selector: '.eh-ghost-edge.eh-preview-active',
        style: {
          'opacity': 0
        }
    }
] as cytoscape.Stylesheet[];

export default style;
