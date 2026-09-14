export interface Quote {
  id: string;
  text: string;
  source: string;
  length: "short" | "medium" | "long";
}

// Public-domain literary passages, historical speeches, and proverbs.
export const ENGLISH_QUOTES: Quote[] = [
  // short
  { id: "s1", text: "To be, or not to be, that is the question.", source: "William Shakespeare, Hamlet", length: "short" },
  { id: "s2", text: "I think, therefore I am.", source: "René Descartes", length: "short" },
  { id: "s3", text: "Ask not what your country can do for you.", source: "John F. Kennedy", length: "short" },
  { id: "s4", text: "A journey of a thousand miles begins with a single step.", source: "Lao Tzu", length: "short" },
  { id: "s5", text: "Actions speak louder than words.", source: "Proverb", length: "short" },
  { id: "s6", text: "The pen is mightier than the sword.", source: "Edward Bulwer-Lytton", length: "short" },
  { id: "s7", text: "Not all those who wander are lost.", source: "J.R.R. Tolkien", length: "short" },
  { id: "s8", text: "The only thing we have to fear is fear itself.", source: "Franklin D. Roosevelt", length: "short" },
  { id: "s9", text: "Well begun is half done.", source: "Aristotle", length: "short" },
  { id: "s10", text: "Fortune favors the bold.", source: "Virgil", length: "short" },

  // medium
  { id: "m1", text: "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.", source: "Robert Frost, The Road Not Taken", length: "medium" },
  { id: "m2", text: "I have not failed. I have just found ten thousand ways that will not work.", source: "Thomas Edison", length: "medium" },
  { id: "m3", text: "Whether you think you can, or you think you can't, you're right.", source: "Henry Ford", length: "medium" },
  { id: "m4", text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", source: "Winston Churchill", length: "medium" },
  { id: "m5", text: "Give me your tired, your poor, your huddled masses yearning to breathe free.", source: "Emma Lazarus, The New Colossus", length: "medium" },
  { id: "m6", text: "All that glitters is not gold; often have you heard that told.", source: "William Shakespeare, The Merchant of Venice", length: "medium" },
  { id: "m7", text: "The only way to do great work is to love what you do, and to keep looking until you find it.", source: "Steve Jobs", length: "medium" },
  { id: "m8", text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", source: "Ralph Waldo Emerson", length: "medium" },
  { id: "m9", text: "Four score and seven years ago our fathers brought forth on this continent a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal.", source: "Abraham Lincoln, Gettysburg Address", length: "medium" },
  { id: "m10", text: "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name.", source: "Arthur Conan Doyle, A Scandal in Bohemia", length: "medium" },

  // long
  { id: "l1", text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.", source: "Charles Dickens, A Tale of Two Cities", length: "long" },
  { id: "l2", text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.", source: "Jane Austen, Pride and Prejudice", length: "long" },
  { id: "l3", text: "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.", source: "Herman Melville, Moby-Dick", length: "long" },
  { id: "l4", text: "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable rights, that among these are life, liberty, and the pursuit of happiness.", source: "United States Declaration of Independence", length: "long" },
  { id: "l5", text: "It is a far, far better thing that I do, than I have ever done; it is a far, far better rest that I go to, than I have ever known.", source: "Charles Dickens, A Tale of Two Cities", length: "long" },
  { id: "l6", text: "In the beginning God created the heaven and the earth. And the earth was without form, and void; and darkness was upon the face of the deep.", source: "Genesis 1:1-2", length: "long" },
];
