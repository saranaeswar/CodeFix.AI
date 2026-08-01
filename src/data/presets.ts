import { BugPreset } from "../types";

export const BUG_PRESETS: BugPreset[] = [
  {
    id: "py-mutable-default",
    title: "Python: Mutable Default Argument & Loop Bug",
    language: "Python",
    category: "Logical Error",
    description: "Contains a default list accumulator bug and an off-by-one iteration issue.",
    code: `def add_item(item, target_list=[]):
    target_list.append(item)
    return target_list

def get_even_numbers(n):
    evens = []
    # Off-by-one error: misses 'n' if n is even
    for i in range(0, n):
        if i % 2 == 0:
            evens.append(i)
    return evens
`
  },
  {
    id: "js-async-map",
    title: "JavaScript: Async ForEach Race Condition",
    language: "JavaScript",
    category: "Runtime Error",
    description: "Using async callback inside Array.prototype.forEach fails to await completion.",
    code: `async function fetchAllUsers(userIds) {
  let users = [];
  // Bug: forEach does not await async functions
  userIds.forEach(async (id) => {
    const response = await fetch(\`/api/users/\${id}\`);
    const data = await response.json();
    users.push(data);
  });
  return users;
}
`
  },
  {
    id: "cpp-dangling-ptr",
    title: "C++: Dangling Pointer Reference",
    language: "C++",
    category: "Runtime Error",
    description: "Returning pointer to a local stack variable that goes out of scope.",
    code: `#include <iostream>

int* getStackPointer() {
    int value = 42;
    return &value; // Bug: returns address of stack memory that will be destroyed
}

int main() {
    int* ptr = getStackPointer();
    std::cout << "Value: " << *ptr << std::endl;
    return 0;
}
`
  },
  {
    id: "java-null-check",
    title: "Java: NullPointerException & String Equality",
    language: "Java",
    category: "Runtime Error",
    description: "Calling method on potentially null string and comparing strings with '=='.",
    code: `public class RoleValidator {
    public static boolean checkAdminRole(String roleName, String systemDomain) {
        // Bug: roleName can be null causing NPE, and '==' checks reference equality
        if (roleName.equals("ADMIN") || systemDomain == "prod.local") {
            return true;
        }
        return false;
    }
}
`
  },
  {
    id: "ts-array-bounds",
    title: "TypeScript: Off-By-One Array Boundary",
    language: "TypeScript",
    category: "Logical Error",
    description: "Loop condition <= length causes out-of-bounds undefined access and NaN results.",
    code: `function calculateTotal(items: number[]): number {
  let total = 0;
  // Bug: 'i <= items.length' causes undefined access at last iteration
  for (let i = 0; i <= items.length; i++) {
    total += items[i];
  }
  return total;
}
`
  },
  {
    id: "sql-cartesian-join",
    title: "SQL: Missing Join Clause & Group By Failure",
    language: "SQL",
    category: "Syntax Error",
    description: "Implicit cartesian product without explicit JOIN clause and incomplete GROUP BY.",
    code: `SELECT u.id, u.username, COUNT(o.id) as total_orders
FROM users u, orders o
WHERE o.status = 'COMPLETED'
`
  },
  {
    id: "py-no-bug",
    title: "Python: Valid & Correct Binary Search (Clean Code)",
    language: "Python",
    category: "No Bug (Clean Code)",
    description: "Clean, syntactically correct binary search implementation to test NO_BUG verification.",
    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1
`
  }
];
