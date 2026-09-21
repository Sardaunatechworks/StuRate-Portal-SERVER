import http from 'http';
import app from './src/app';

const PORT = 5001; // use separate test port

function request(
  method: string,
  path: string,
  token?: string,
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode || 200, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode || 200, data: rawData });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  const server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });

  try {
    console.log('--- TEST 1: Health Check ---');
    const health = await request('GET', '/api/health');
    console.log('Health Status:', health.status, health.data.status);
    if (health.status !== 200) throw new Error('Health check failed');

    console.log('\n--- TEST 2: Admin Authentication ---');
    const adminLogin = await request('POST', '/api/auth/login', undefined, {
      email: 'admin@university.edu.ng',
      password: 'Password123!',
    });
    console.log('Admin Login Status:', adminLogin.status, adminLogin.data.message);
    if (adminLogin.status !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;

    console.log('\n--- TEST 3: Student Authentication ---');
    const studentLogin = await request('POST', '/api/auth/login', undefined, {
      email: 'john.doe@student.university.edu.ng',
      password: 'Password123!',
    });
    console.log('Student Login Status:', studentLogin.status, studentLogin.data.data.user.name);
    if (studentLogin.status !== 200) throw new Error('Student login failed');
    const studentToken = studentLogin.data.data.token;

    console.log('\n--- TEST 4: Student Eligible Courses & Questions ---');
    const eligible = await request('GET', '/api/student/evaluations/dashboard', studentToken);
    console.log(
      'Eligible Evaluations count:',
      eligible.data.data.totalEligible,
      'Active Period:',
      eligible.data.data.activePeriod?.title
    );
    if (eligible.data.data.totalEligible === 0) throw new Error('No eligible courses found');

    const firstAssignment = eligible.data.data.evaluations[0];
    console.log('Target Assignment:', firstAssignment.courseCode, 'Lecturer:', firstAssignment.lecturerName);

    const form = await request(
      'GET',
      `/api/student/evaluations/form/${firstAssignment.assignmentId}`,
      studentToken
    );
    console.log('Questions count:', form.data.data.questions.length);
    if (form.data.data.questions.length !== 9) throw new Error('Expected 9 criteria questions');

    console.log('\n--- TEST 5: Submit Evaluation ---');
    const ratings = form.data.data.questions.map((q: any) => ({
      questionId: q.id,
      rating: 5,
    }));

    const submitRes = await request('POST', '/api/student/evaluations', studentToken, {
      courseAssignmentId: firstAssignment.assignmentId,
      comment: 'Excellent lecture delivery, very thorough and inspiring teaching.',
      ratings,
    });
    console.log('Submit Status:', submitRes.status, submitRes.data.message);
    if (submitRes.status !== 201) throw new Error('Evaluation submission failed');

    console.log('\n--- TEST 6: DUPLICATE PREVENTION CHECK ---');
    const dupRes = await request('POST', '/api/student/evaluations', studentToken, {
      courseAssignmentId: firstAssignment.assignmentId,
      comment: 'Attempting duplicate evaluation',
      ratings,
    });
    console.log('Duplicate Attempt Status:', dupRes.status, dupRes.data.message);
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate submission, got ${dupRes.status}`);
    }
    console.log('SUCCESS: Duplicate evaluation was correctly rejected with 409 Conflict!');

    const targetLecturerEmail = firstAssignment.lecturerName.includes('Ada')
      ? 'ada.lovelace@university.edu.ng'
      : 'alan.turing@university.edu.ng';

    console.log(`\n--- TEST 7: Lecturer Authentication & Analytics (${targetLecturerEmail}) ---`);
    const lecturerLogin = await request('POST', '/api/auth/login', undefined, {
      email: targetLecturerEmail,
      password: 'Password123!',
    });
    console.log('Lecturer Login Status:', lecturerLogin.status);
    const lecturerToken = lecturerLogin.data.data.token;

    const lecturerDashboard = await request('GET', '/api/lecturer/dashboard', lecturerToken);
    console.log(
      'Lecturer Dashboard Overall Score:',
      lecturerDashboard.data.data.overallAverage,
      'Evaluations count:',
      lecturerDashboard.data.data.totalEvaluations
    );

    const lecturerAnalytics = await request('GET', '/api/lecturer/analytics', lecturerToken);
    console.log('Lecturer Criteria Count:', lecturerAnalytics.data.data.criteriaAverages.length);
    console.log('Top Criterion Score:', lecturerAnalytics.data.data.criteriaAverages[0]?.average);

    const lecturerComments = await request('GET', '/api/lecturer/comments', lecturerToken);
    console.log('Lecturer Comments Received:', lecturerComments.data.data.length);
    if (lecturerComments.data.data.length > 0) {
      const commentItem = lecturerComments.data.data[0];
      console.log('Comment Content:', commentItem.comment);
      console.log('Comment Author:', commentItem.author);
      // Verify zero student identity leaked
      if (commentItem.studentId || commentItem.matricNumber || commentItem.name || commentItem.email) {
        throw new Error('SECURITY VIOLATION: Student identity leaked to lecturer comments API!');
      }
      console.log('SUCCESS: Anonymity verified. Student identity strictly protected.');
    }

    console.log('\n--- TEST 8: Admin Reports ---');
    const adminReports = await request('GET', '/api/admin/reports', adminToken);
    console.log('Admin Reports Total Evaluations:', adminReports.data.data.totalEvaluationsFound);
    console.log('Admin Reports Lecturer Summaries:', adminReports.data.data.lecturerSummaries.length);

    console.log('\n==========================================');
    console.log('ALL API & WORKFLOW INTEGRATION TESTS PASSED!');
    console.log('==========================================\n');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runTests();
