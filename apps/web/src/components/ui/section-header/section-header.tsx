import { Box, Text, type BoxProps } from '@mantine/core';
import classes from './section-header.module.css';

interface SectionHeaderProps extends BoxProps {
  title: string;
}

export const SectionHeader = ({ title, ...props }: SectionHeaderProps) => {
  return (
    <Box {...props}>
      <Text className={classes.sectionTitle}>{title}</Text>
    </Box>
  );
};
