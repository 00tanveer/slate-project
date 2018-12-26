import React, { Component } from 'react';
import styled from 'styled-components';
import { Editor } from 'slate-react';
import { Block, Value } from 'slate';
import { isKeyHotkey } from 'is-hotkey';

import { Button } from '../components/toolbar/Button';
import { Icon } from '../components/toolbar/Icon';
import { Toolbar } from '../components/toolbar/Toolbar';

const DEFAULT_NODE = 'paragraph';
const isBoldHotkey = isKeyHotkey('mod+b')
const isItalicHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')
const isCodeHotkey = isKeyHotkey('mod+`')

const Image = styled.img`
  display: block;
  max-width: 100%;
  max-height: 20em;
  box-shadow: ${props => (props.selected ? '0 0 0 2px blue;' : 'none')};
`
const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: 'A line of text in a paragraph.',
              },
            ],
          },
        ],
      },
    ],
  },
});

function insertImage(editor, src, target) {
  if (target) {
    editor.select(target)
  }

  editor.insertBlock({
    type: 'image',
    data: { src },
  })
}

const schema = {
  document: {
    last: { type: 'paragraph' },
    normalize: (editor, { code, node, child }) => {
      switch (code) {
        case 'last_child_type_invalid': {
          const paragraph = Block.create('paragraph')
          return editor.insertNodeByKey(node.key, node.nodes.size, paragraph)
        }
      }
    },
  },
  blocks: {
    image: {
      isVoid: true,
    },
  },
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: initialValue
    }
  }
  onChange = ({ value }) => {
    this.setState({ value }, () => {
    //console.log(JSON.stringify(value.toJSON()));
    console.log(value.toJSON());
    })
  }
  onKeyDown = (event, editor, next) => {
    let mark;

    if (isBoldHotkey(event)) {
      mark = 'bold';
    } else if (isItalicHotkey(event)) {
      mark = 'italic';
    } else if (isUnderlinedHotkey(event)) {
      mark = 'underlined';
    } else if (isCodeHotkey(event)) {
      mark = 'code';
    } else {
      return next();
    }

    event.preventDefault()
    editor.toggleMark(mark)
  }
  hasMark = type => {
    const { value } = this.state
    return value.activeMarks.some(mark => mark.type == type)
  }
  hasBlock = type => {
    const { value } = this.state
    return value.blocks.some(node => node.type == type)
  }
  ref = editor => {
    this.editor = editor
  }
  renderMarkButton = (type, icon) => {
    const isActive = this.hasMark(type)

    return (
      <Button
        active={isActive}
        onMouseDown={event => this.onClickMark(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    )
  }
  renderBlockButton = (type, icon) => {
    let isActive = this.hasBlock(type)

    if (['numbered-list', 'bulleted-list'].includes(type)) {
      const { value: { document, blocks } } = this.state

      if (blocks.size > 0) {
        const parent = document.getParent(blocks.first().key)
        isActive = this.hasBlock('list-item') && parent && parent.type === type
      }
    }

    return (
      <Button
        active={isActive}
        onMouseDown={event => this.onClickBlock(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    )
  }
  renderNode = (props, editor, next) => {
    const { attributes, children, node, isFocused } = props

    switch (node.type) {
      case 'block-quote':
        return <blockquote {...attributes}>{children}</blockquote>
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>
      case 'list-item':
        return <li {...attributes}>{children}</li>
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>
      case 'image': {
        const src = node.data.get('src')
        return <Image src={src} selected={isFocused} {...attributes} />
      }
      default:
        return next()
    }
  }
  renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>
      case 'code':
        return <code {...attributes}>{children}</code>
      case 'italic':
        return <em {...attributes}>{children}</em>
      case 'underlined':
        return <u {...attributes}>{children}</u>
      default:
        return next()
    }
  }
  onClickMark = (event, type) => {
    event.preventDefault()
    this.editor.toggleMark(type)
  }

  onClickBlock = (event, type) => {
    event.preventDefault()

    const { editor } = this
    const { value } = editor
    const { document } = value

    // Handle everything but list buttons.
    console.log(type);
    if (type != 'bulleted-list' && type != 'numbered-list') {
      const isActive = this.hasBlock(type)
      const isList = this.hasBlock('list-item')

      if (isList) {
        editor
          .setBlocks(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')
      } else {
        editor.setBlocks(isActive ? DEFAULT_NODE : type)
      }
    } else {
      // Handle the extra wrapping required for list buttons.
      const isList = this.hasBlock('list-item')
      console.log('isList, ',isList);
      const isType = value.blocks.some(block => {
        return !!document.getClosest(block.key, parent => parent.type == type)
      })
      console.log('isType, ', isType);
      //console.log(document.nodes);
      if (isList && isType) {
        editor
          //.setBlocks(DEFAULT_NODE)
          //.unwrapBlock('bulleted-list')
          .unwrapBlock(
            type == 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
          )
          //.unwrapBlock('numbered-list')
      } else if (isList) {
        console.log('HERERE');
        editor
          // .unwrapBlock(
          //   type == 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
          // )
          .wrapBlock(type)
      } else {
        editor.setBlocks('list-item').wrapBlock(type)
      }
    }
  }

  onClickImage = event => {
    event.preventDefault();
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.click();
    input.onchange = () => {
      const file = input.files[0];
      const [mime] = file.type.split('/');
      if (mime !== 'image') {
        alert("Choose a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        this.editor.command(insertImage, reader.result);
      });
      reader.readAsDataURL(file);
    };
  }

  render() {
    return (
    <div>
      <Toolbar>
        {this.renderMarkButton('bold', 'format_bold')}
        {this.renderMarkButton('italic', 'format_italic')}
        {this.renderMarkButton('underlined', 'format_underlined')}
        {this.renderMarkButton('code', 'code')}
        {this.renderBlockButton('heading-one', 'looks_one')}
        {this.renderBlockButton('heading-two', 'looks_two')}
        {this.renderBlockButton('block-quote', 'format_quote')}
        {this.renderBlockButton('numbered-list', 'format_list_numbered')}
        {this.renderBlockButton('bulleted-list', 'format_list_bulleted')}
        <Button onMouseDown={this.onClickImage}>
            <Icon>image</Icon>
          </Button>
      </Toolbar>
      <Editor 
        spellCheck
        autoFocus
        placeholder="Enter some rich text..."
        ref={this.ref}
        value={this.state.value} 
        schema={schema}
        onChange={this.onChange} 
        onKeyDown={this.onKeyDown}
        renderNode={this.renderNode}
        renderMark={this.renderMark}/>
      </div>
    );
  }
}

export default App;
