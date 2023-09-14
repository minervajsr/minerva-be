function calculateMatchingScore(userSkills, jobRequiredSkills) {
  if (jobRequiredSkills.length === 0) {
    return 0; // Avoid division by zero
  }
  const matchingSkills = [];
  for (const skill of userSkills) {
    if (jobRequiredSkills.includes(skill)) {
      matchingSkills.push(skill);
    }
  }

  const matchingScore = matchingSkills.length / jobRequiredSkills.length;
  return matchingScore;
}

function normalizeSkills(skills) {
  return skills.map((skill) => skill.toLowerCase());
}

function filterAndSortJobs(userskills, postedJobData) {
  const userSkills = normalizeSkills(userskills);

  const filteredAndScoredJobs = postedJobData.map((job) => {
    const normalizedRequiredSkills = normalizeSkills(job.jobSkills);
    const matchingScore = calculateMatchingScore(
      userSkills,
      normalizedRequiredSkills
    );
    let temp = { ...job.toObject(), matchingScore };
    return temp;
  });
  //   console.log("filteredAndScoredJobs", filteredAndScoredJobs);

  // Custom sorting algorithm based on matching score (counting sort)
  const scoreCounts = Array(101).fill(0);
  for (const job of filteredAndScoredJobs) {
    const normalizedScore = Math.floor(job.matchingScore * 100);
    scoreCounts[normalizedScore]++;
  }

  let currentIndex = 0;
  for (let i = 100; i >= 0; i--) {
    while (scoreCounts[i] > 0) {
      filteredAndScoredJobs[currentIndex].matchingScore = i / 100;
      currentIndex++;
      scoreCounts[i]--;
    }
  }

  return filteredAndScoredJobs;
}

const jobFilter = (jobs, skills) => {
  //   console.log("jobFilter", jobs);
  try {
    const filteredAndSortedJobs = filterAndSortJobs(skills, jobs);
    return filteredAndSortedJobs;
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

module.exports = jobFilter;
