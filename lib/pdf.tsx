import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { OptimizedResume } from '@/types/cv';

Font.register({
  family: 'Helvetica',
  fonts: [],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 48,
    color: '#111',
  },
  name: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    borderBottomStyle: 'solid',
    marginTop: 12,
    marginBottom: 4,
    paddingBottom: 2,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  bullet: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 2,
    marginLeft: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  jobDates: {
    fontSize: 10,
    color: '#555',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 2,
  },
});

interface ResumePDFProps {
  resume: OptimizedResume;
  candidateName?: string;
}

export function ResumePDF({ resume, candidateName }: ResumePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {candidateName && <Text style={styles.name}>{candidateName}</Text>}

        {/* Professional Summary */}
        {resume.professionalSummary && (
          <>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.text}>{resume.professionalSummary}</Text>
          </>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {resume.experience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>
                    {exp.title} — {exp.company}
                  </Text>
                  <Text style={styles.jobDates}>
                    {exp.startDate} – {exp.endDate}
                  </Text>
                </View>
                {exp.bullets.map((b, j) => (
                  <Text key={j} style={styles.bullet}>
                    • {b}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            {resume.skills.map((group, i) => (
              <View key={i} style={{ marginBottom: 4 }}>
                <Text style={styles.text}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                    {group.category}:{' '}
                  </Text>
                  {group.skills.join(', ')}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((edu, i) => (
              <View key={i} style={styles.jobHeader}>
                <Text style={styles.jobTitle}>
                  {edu.degree} in {edu.field} — {edu.institution}
                </Text>
                <Text style={styles.jobDates}>{edu.graduationDate}</Text>
              </View>
            ))}
          </>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {resume.certifications.map((c, i) => (
              <Text key={i} style={styles.bullet}>
                • {c}
              </Text>
            ))}
          </>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Languages</Text>
            {resume.languages.map((l, i) => (
              <Text key={i} style={styles.text}>
                {l.language}: {l.proficiency}
              </Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
