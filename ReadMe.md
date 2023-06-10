# Hive
Hive is a 2-dimensional Programming Language, based on the idea of Hive intelligence.

An single ant (instruction pointer) can only solve the most basic tasks,
 but if through the interactions of multiple ants much more complicated tasks can be completed.

## Examples

print Fibonacci numbers less than 1000:
```
 #1 v <
#1> +!{
 /l w<0001#<
  ^ < \&32.@
 \   /
```

"Hello World" Program:
```
#72 .@#101.@#108.@
#108.@#111.@#32 .@
#87 .@#111.@#114.@
#108.@#100.@#33 .@
```

## Usage
Run the given HTML file in a browser (I tested only the newest version of Firefox),
the script `hiveLang.js` should be in the same directory as the HTML file

### Interpreter mode
<!-- TODO more intuitive controls -->
top left area -> input
bottom left -> output

- `s` step forward
- `r` reset
- `ctrl-e` switch to text-edit mode

### Edit Mode
Simple 2D Text editor

double-clicking on a cell will activate edit-mode and move the edit cursor to that cell

Use the arrow keys to move the cursor, writing a character will insert it in the current cell and advance the edit cursor by one cell, writing a mirror will update the edit-direction.

Keyboard shortcuts
- `ctrl-e` switch to text-edit mode
- `ctrl-s` switch to interpreter mode
- `Enter` switch to interpreter mode

### Text Edit Mode

Keyboard shortcuts
- `ctrl-e` switches in/out of text-edit mode
- `ctrl-s` switch to interpreter mode

Text edit mode allows to edit the source-code directly as a text and to copy/paste text from/to external files


## Memory
The only way to store information in a Hive program is within the ants themselves
Each ant can remember a single (signed) 32-bit integer to store more complicated information multiple ants have to work together.

Common memory constructs:
### Stacks & Queues

The instructions `[ ]` and `( )` can be used to construct queues and stacks.
Both constructions assume that all arriving ants have distances that are multiples of 2

* Queue (`[]`)

```
     D
     ^
 A> [] >C
     ^
     B
```

Enqueue:
Ants moving east from `A` will get trapped between the brackets.

Dequeue:
When an ant moving north from `B` hits the bracket the first ant in the queue will leave the brackets in direction `C`, the ant coming from `B` will continue moving towards `D`. If no ants are in the queue, the incoming ant will be waiting in the bracket until an ant is added to the queue.

* Stack (`>(]`)

```
     C
     ^
 A> >(]
     ^
     B
```

Push:
Ants moving east from `A` will get trapped between `>` and `]`

Pop:
When an ant moving north from `B` hits the bracket the first ant in the queue will leave the brackets in direction `C`, the ant coming from `B` will be killed in the process. If no ants are on the stack, the incoming ant will be waiting in the bracket until an ant is added to the stack.


## Syntax

Hive is a 2 dimensional Programming language meaning that the Ants will move on a two dimensional grid.

Each instruction step the ants will move one step in their current movement direction and then execute the action of the cell they arrive on, if an ant leaves the grid it will die.

Some operations need multiple ants, if an ant reaches such an operation it will wait for another ant to arrive,
in each cell there can be at most one waiting ant at any given moment.

The program terminates if all ants have died or if all living ants are waiting on a cell.

### Instructions

#### Control Flow
- `#` creates an ant (facing east) at the start of the program
- `@` kills ant

- `<` `^` `>` `v` rotate the ant to face the given direction
- `/` `\` mirrors (act the way you expect the to work

- `{` `}` clone ant:
 ants hitting the outer side of the bracket will be split in a pair of ants, one moving north the other one moving south,
 ants hitting the inside of the bracket will reverse direction, no effect on ant moving in north-south direction.

Diagram of possible actions (arrows indicate moving direction of incoming ant)
```
         ^
 >{  =>  {    {< =>  {>
         v 

  ^      v 
  {  =>  {    {  =>   {
  ^                   v
```

- `[` `]`
If no ant is waiting in the current cell, `[` and `]` act as one-way mirrors for ants moving in east-west direction `>[  =>  [>`  `[<  =>  [>`.
If another ant is already waiting at the cell this ant will be released, and ants moving in east-east direction will continue moving in their previous direction.
Independent of the previous state of the cell ants moving in north-south direction will wait on the cell until the next ant arrives.

<!-- XXX? formulation-->
- `(` `)` (description only for `(`, `)` acts the same but with east and west swapped)

Ants moving east, will release any ants waiting in the cell, and then wait for the next ant to arrive.
If there are ants waiting in the cell, ants moving west will be redirected to move east, 
if no ants are waiting they will continue to move west.
Ants moving in north-south direction will push out any waiting ant in their own moving direction and then be killed.

#### Memory Modification

- `&` set memory of ant to zero
- `0`-`9` multiply memory by 10, then add given digit (subtract digit if memory<0)
- `~` multiply memory of ant by minus one

#### Binary Operators

compute the result of an arithmetic operation using two ants, if only one ant is present wait for a second ant:
computed values ( `A` is the memory value of the first ant )

- `+` :  `A` `B` -> `A+B` `B`
- `-` :  `A` `B` -> `A-B` `B`
- `*` :  `A` `B` -> `A*B` `B`
- `%` :  `A` `B` -> `A/B` `A%B`
- `=` :  `A` `B` -> `A==B` `B` ( with `A==B` being `1` if the values are equal and zero otherwise )
   
#### Filters

Wait for a second ant check condition, kill the second ant if condition is not satisfied
- `w` just wait, no kill condition
- `l` kill second ant if its value, is greater than or equal to the value of the the first ant
- `g` kill second ant if its value, is less than or equal to the value of the the first ant
- `e` kill second ant if its value, is not equal to the value of the first ant

#### IO
- `,` read byte from standard input (or `-1` if no bytes are available)
- `.` write byte to standard output
- `?` read number from standard input,
  skips characters until `+` `-` or digit ( `0` - `9` ) is read, reads until the first non-digit character, the character after the last digit will not be consumed and can be read by `,`
- `!` writes the memory value of the passing ant to standard output
