const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const questions = [
  // Software Engineering - DSA
  { role: "Software Engineer", topic: "Data Structures", difficulty: "Easy", question: "What is the time complexity of accessing an element in an array by index?", answer: "O(1) — arrays provide constant-time random access because elements are stored contiguously in memory." },
  { role: "Software Engineer", topic: "Data Structures", difficulty: "Medium", question: "Explain the difference between a stack and a queue.", answer: "A stack is LIFO (Last In, First Out) while a queue is FIFO (First In, First Out). Stacks use push/pop; queues use enqueue/dequeue." },
  { role: "Software Engineer", topic: "Data Structures", difficulty: "Hard", question: "How does a HashMap handle collisions internally?", answer: "Most implementations use chaining (linked list at each bucket) or open addressing (linear probing, quadratic probing). Java's HashMap uses chaining and converts to a balanced tree (TreeMap) when a bucket exceeds 8 entries." },
  { role: "Software Engineer", topic: "Algorithms", difficulty: "Easy", question: "What is the difference between BFS and DFS?", answer: "BFS (Breadth-First Search) explores all neighbors level by level using a queue. DFS (Depth-First Search) explores as deep as possible before backtracking, using a stack or recursion." },
  { role: "Software Engineer", topic: "Algorithms", difficulty: "Medium", question: "What is dynamic programming and when should you use it?", answer: "DP breaks problems into overlapping subproblems and stores results to avoid redundant computation. Use it when the problem has optimal substructure and overlapping subproblems (e.g., Fibonacci, longest common subsequence)." },
  { role: "Software Engineer", topic: "Algorithms", difficulty: "Hard", question: "Explain the concept of amortized time complexity with an example.", answer: "Amortized analysis averages the time per operation over a sequence. Example: dynamic array append is O(1) amortized — most appends are O(1) but occasional resizing is O(n). Over n operations total cost is O(n), so amortized O(1) per operation." },

  // System Design
  { role: "Software Engineer", topic: "System Design", difficulty: "Medium", question: "What is the difference between horizontal and vertical scaling?", answer: "Vertical scaling adds more resources (CPU/RAM) to a single server. Horizontal scaling adds more servers. Horizontal scaling is preferred for high availability and fault tolerance." },
  { role: "Software Engineer", topic: "System Design", difficulty: "Medium", question: "Explain what a CDN is and why it's used.", answer: "A Content Delivery Network distributes static assets (images, JS, CSS) across geographically distributed servers. It reduces latency by serving content from the nearest server to the user." },
  { role: "Software Engineer", topic: "System Design", difficulty: "Hard", question: "How would you design a URL shortener like bit.ly?", answer: "Key components: hash function to generate short codes (base62 encoding), database to store mappings, cache layer (Redis) for frequent redirects, load balancer, and a redirect service. Handle collisions and custom aliases." },

  // Frontend
  { role: "Frontend Engineer", topic: "React", difficulty: "Easy", question: "What is the difference between state and props in React?", answer: "Props are immutable data passed from parent to child. State is mutable data managed within a component. When state changes, the component re-renders." },
  { role: "Frontend Engineer", topic: "React", difficulty: "Medium", question: "Explain how React's useEffect hook works and when to use it.", answer: "useEffect runs side effects after render. The dependency array controls when it runs: empty [] means once on mount, [dep] means when dep changes, no array means after every render. Return a cleanup function to prevent memory leaks." },
  { role: "Frontend Engineer", topic: "React", difficulty: "Hard", question: "What is React reconciliation and how does the virtual DOM work?", answer: "React maintains a virtual DOM (JS object representation of the real DOM). On state change, React creates a new virtual DOM, diffs it against the previous (reconciliation), and updates only the changed real DOM nodes (commit phase). This makes updates efficient." },
  { role: "Frontend Engineer", topic: "CSS", difficulty: "Easy", question: "What is the CSS box model?", answer: "The box model consists of: content, padding, border, and margin. By default (box-sizing: content-box), width/height apply to content only. With box-sizing: border-box, width/height include padding and border." },
  { role: "Frontend Engineer", topic: "Performance", difficulty: "Medium", question: "What is code splitting and how does it improve performance?", answer: "Code splitting breaks a JavaScript bundle into smaller chunks loaded on demand. In React, use React.lazy() + Suspense or dynamic imports. This reduces initial bundle size and improves time-to-interactive." },

  // Backend
  { role: "Backend Engineer", topic: "APIs", difficulty: "Easy", question: "What is the difference between REST and GraphQL?", answer: "REST uses fixed endpoints per resource with HTTP verbs. GraphQL uses a single endpoint where clients specify exactly what data they need, avoiding over-fetching and under-fetching." },
  { role: "Backend Engineer", topic: "Databases", difficulty: "Medium", question: "What is an index in a database and when should you use one?", answer: "An index is a data structure (usually B-tree) that speeds up read queries by reducing the rows scanned. Use indexes on columns frequently used in WHERE, JOIN, or ORDER BY clauses. Trade-off: indexes slow down writes." },
  { role: "Backend Engineer", topic: "Databases", difficulty: "Medium", question: "Explain the difference between SQL and NoSQL databases.", answer: "SQL databases are relational with fixed schemas and ACID transactions (e.g., PostgreSQL). NoSQL databases are non-relational with flexible schemas, designed for horizontal scaling (e.g., MongoDB, Redis). Choose based on data structure and consistency requirements." },
  { role: "Backend Engineer", topic: "Security", difficulty: "Medium", question: "What is SQL injection and how do you prevent it?", answer: "SQL injection is an attack where malicious SQL is injected into a query. Prevent it by using parameterized queries / prepared statements, ORMs, and input validation. Never concatenate user input directly into SQL strings." },
  { role: "Backend Engineer", topic: "System Design", difficulty: "Hard", question: "What is the CAP theorem?", answer: "CAP theorem states a distributed system can guarantee at most two of: Consistency (all nodes see the same data), Availability (every request gets a response), and Partition tolerance (system works despite network failures). In practice, partition tolerance is required, so the choice is between CP and AP systems." },

  // Behavioral
  { role: "Any", topic: "Behavioral", difficulty: "Easy", question: "Tell me about a time you had to work with a difficult team member.", answer: "Use the STAR method: Situation, Task, Action, Result. Focus on how you communicated, found common ground, and achieved the goal." },
  { role: "Any", topic: "Behavioral", difficulty: "Easy", question: "Describe a project you're most proud of and why.", answer: "Highlight technical challenges, your specific contributions, the impact it had, and what you learned. Be specific with metrics where possible." },
  { role: "Any", topic: "Behavioral", difficulty: "Medium", question: "How do you handle a situation where you disagree with your manager's technical decision?", answer: "Express your concerns respectfully with data/reasoning, listen to their perspective, and ultimately support the team decision. Document your concerns if needed." },
];

async function seed() {
  console.log("Seeding question bank...");
  await prisma.question.createMany({ data: questions, skipDuplicates: true });
  console.log(`Seeded ${questions.length} questions.`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
