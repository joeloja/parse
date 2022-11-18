import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class ParserService {
  private node(type: string, level: number) {
    const children = [],
      properties = {};
    let parent = null;

    return {
      type,
      children,
      properties,
      parent: () => parent,
      level: () => (level == undefined ? -1 : level),
      setParent: (p) => {
        parent = p;
      },
      appendChildren(child) {
        this.children.push(child);
        child.setParent(this);
        return this;
      },
      appendProperty: (key, value) => {
        properties[key] = value;
        return this;
      },
    };
  }

  private appendRec(prev, curr) {
    if (typeof curr == 'string') {
      if (curr == '') return prev;

      curr = curr.split('  ');
      curr = this.node(curr.pop(), curr.length);
    }

    if (curr.level() > prev.level()) {
      if (curr.type[0].toLowerCase() == curr.type[0]) {
        const key = curr.type.split(': ')[0];
        const value = curr.type.split(': ')[1];
        prev.appendProperty(key, value);
        return prev;
      } else {
        prev.appendChildren(curr);
      }
    } else if (curr.level() < prev.level()) {
      this.appendRec(prev.parent(), curr);
    } else {
      prev.parent().appendChildren(curr);
    }

    return curr;
  }
  public parse(filepath: string): object[] {
    const root = this.node('root', null);

    const data = fs.readFileSync(filepath, 'utf8');

    data.toString().split('\n').reduce(this.appendRec.bind(this), root);

    return JSON.parse(JSON.stringify(root.children, null));
  }
}
