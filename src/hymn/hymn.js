export const NO_OP = -1

export const OP_PLUS = 0
export const OP_MINUS = 1
export const OP_MULTIPLY = 2
export const OP_DIVIDE = 3
export const OP_FUNCTION = 4
export const OP_IF = 5
export const OP_ELSE = 6
export const OP_ELIF = 7
export const OP_WHILE = 8
export const OP_END = 9
export const OP_CONTINUE = 10
export const OP_BREAK = 11

export const OP_INT = 12
export const OP_FLOAT = 13
export const OP_BOOLEAN = 14
export const OP_STRING = 15

export const OP_INT_LITERAL = 16
export const OP_FLOAT_LITERAL = 17
export const OP_BOOLEAN_LITERAL = 18
export const OP_STRING_LITERAL = 19

export const OP_AND = 20
export const OP_DOT = 21
export const OP_ID = 22
export const OP_FOR = 23
export const OP_ASYNC = 24
export const OP_AWAIT = 25
export const OP_RETURN = 26
export const OP_CLASS = 27
export const OP_INTERFACE = 28
export const OP_IMPLEMENTS = 29
export const OP_ENUM = 30
export const OP_OR = 31
export const OP_NOT = 32
export const OP_MATCH = 33
export const OP_PASS = 34
export const OP_NONE = 35
export const OP_IMPORT = 36
export const OP_TRUE = 37
export const OP_FALSE = 38

export const OP_EOF = 39

export const OP_WORD_MAP = new Map()
OP_WORD_MAP.set(OP_FUNCTION, 'function')
OP_WORD_MAP.set(OP_IF, 'if')
OP_WORD_MAP.set(OP_ELSE, 'else')
OP_WORD_MAP.set(OP_ELIF, 'elif')
OP_WORD_MAP.set(OP_END, 'end')
OP_WORD_MAP.set(OP_FOR, 'for')
OP_WORD_MAP.set(OP_WHILE, 'while')
OP_WORD_MAP.set(OP_CONTINUE, 'continue')
OP_WORD_MAP.set(OP_BREAK, 'break')
OP_WORD_MAP.set(OP_ASYNC, 'async')
OP_WORD_MAP.set(OP_AWAIT, 'await')
OP_WORD_MAP.set(OP_RETURN, 'return')
OP_WORD_MAP.set(OP_CLASS, 'class')
OP_WORD_MAP.set(OP_INTERFACE, 'interface')
OP_WORD_MAP.set(OP_IMPLEMENTS, 'implements')
OP_WORD_MAP.set(OP_ENUM, 'enum')
OP_WORD_MAP.set(OP_AND, 'and')
OP_WORD_MAP.set(OP_OR, 'or')
OP_WORD_MAP.set(OP_NOT, 'not')
OP_WORD_MAP.set(OP_MATCH, 'match')
OP_WORD_MAP.set(OP_PASS, 'pass')
OP_WORD_MAP.set(OP_NONE, 'none')
OP_WORD_MAP.set(OP_IMPORT, 'import')
OP_WORD_MAP.set(OP_TRUE, 'true')
OP_WORD_MAP.set(OP_FALSE, 'false')

export const operators = new Set()
operators.add('=')
operators.add('+=')
operators.add('-=')
operators.add('*=')
operators.add('/=')

const primitives = new Set()
primitives.add(OP_INT)
primitives.add(OP_FLOAT)
primitives.add(OP_BOOLEAN)
primitives.add(OP_STRING)

const literals = new Map()
literals.set(OP_INT_LITERAL, OP_INT)
literals.set(OP_FLOAT_LITERAL, OP_FLOAT)
literals.set(OP_BOOLEAN_LITERAL, OP_BOOLEAN)
literals.set(OP_STRING_LITERAL, OP_STRING)

export class OpCode {
  constructor(op, value = null) {
    this.op = op
    this.value = value
  }
}

export const EOF = new OpCode(OP_EOF)

export class Parselet {
  constructor(precedence, call) {
    this.precedence = precedence
    this.call = call
  }
}

export const prefixes = new Map()
prefixes.set(OP_INT_LITERAL, new Parselet(6, prefixPrimitive))

export const infixes = new Map()
infixes.set(OP_AND, new Parselet(1, infixCompare))

function digit(c) {
  return c >= '0' && c <= '9'
}

function letter(c) {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')
}

class Stream {
  constructor(code) {
    this.code = code
    this.position = 0
    this.line = 1
    this.column = 0
  }

  size() {
    return this.code.length
  }

  peek() {
    return this.code[this.position]
  }

  peek2() {
    return this.code[this.position + 1]
  }

  next() {
    const c = this.code[this.position]
    this.position++
    if (c === '\n') {
      this.line++
      this.column = 0
    } else {
      this.column++
    }
    return c
  }

  eof() {
    return this.position === this.code.length
  }
}

class Parser {
  constructor(stream) {
    this.stream = stream
    this.size = stream.size()
    this.operations = []
  }

  spaces() {
    const stream = this.stream
    while (!stream.eof()) {
      const c = stream.peek()
      if (c === ' ') {
        stream.next()
      } else break
    }
  }

  num() {
    const stream = this.stream
    let op = OP_INT_LITERAL
    let value = ''
    while (!stream.eof()) {
      const c = stream.peek()
      if (digit(c)) {
        value += c
        stream.next()
      } else if (c === '.') {
        if (op === OP_FLOAT) throw 'Parsing exception'
        op = OP_FLOAT
        value += c
        stream.next()
      } else break
    }
    if (value.length === 0) return null
    return new OpCode(op, value)
  }

  word() {
    const stream = this.stream
    let value = ''
    let begin = true
    while (!stream.eof()) {
      const c = stream.peek()
      if (!letter(c)) {
        if (begin || (c !== '_' && !digit(c))) break
      }
      value += c
      stream.next()
      begin = false
    }
    if (value.length === 0) return null
    return value
  }

  push(op) {
    this.operations.push(op)
    return op
  }

  eat(op) {
    this.stream.next()
    return this.push(op)
  }

  get(position) {
    if (position < this.operations.length) {
      return this.operations[position]
    }
    const stream = this.stream
    if (stream.position >= this.size) {
      return EOF
    }
    this.spaces()
    if (stream.position >= this.size) {
      return EOF
    }
    const c = stream.peek()
    switch (c) {
      case '.':
        return this.eat(new OpCode(OP_DOT))
      case '+':
        return this.eat(new OpCode(OP_PLUS))
      case '-':
        return this.eat(new OpCode(OP_MINUS))
    }
    const num = this.num()
    if (num) return this.push(num)
    const word = this.word()
    if (word) {
      const key = OP_WORD_MAP.get(word)
      if (key === undefined) return this.push(new OpCode(OP_ID, word))
      return this.push(new OpCode(key, word))
    }
    throw 'Parsing exception'
  }
}

function prefixPrimitive(parser, op) {
  const t = literals.get(op)
  if (t === undefined) {
    return null
  }
}

function infixCompare(parser, left, op) {
  console.log(parser, left, op)
}

class Interpreter {
  constructor() {}

  interpret(code) {
    console.log('script:', code)
    const stream = new Stream(code)
    const parser = new Parser(stream)

    let position = 0
    while (true) {
      const op = parser.get(position)
      console.log('op:', op)
      if (op === EOF) break
      position++
    }
    return 'done!'
  }
}

export function script(code) {
  const interpreter = new Interpreter()
  console.log(interpreter.interpret(code))
}
