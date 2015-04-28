library(plyr)
library(sciplot)
rm(list=ls())
setwd("~/Code/gm-perceptual-learning/analysis");

# load data
data_all = read.csv("gm_pl_v1_1.csv", header=TRUE);
data_all$stage = factor(data_all$stage, levels=c("pre", "main", "post"));
data_all$day = as.Date(data_all$timestamp);

d1 = ddply( data_all, c("subject_id"), summarise, pre = length(stage[stage=='pre']), post = length(stage[stage=='post']), main = length(stage[stage=='main'])
          , median_pre_time = median(recorded_time_to_submit[stage=='pre']), median_post_time = median(recorded_time_to_submit[stage=='post'])
          , no_answers_pre = length(stage[stage=='pre' & (recorded_answer=='x=' | recorded_answer=='=x')])
          , no_answers_post = length(stage[stage=='post' & (recorded_answer=='x=' | recorded_answer=='=x')]))

complete_subjects = d1$subject_id[ d1$pre == 20 & d1$post == 20 & d1$no_answers_pre < 10
                                 & d1$no_answers_post < 10 & d1$median_pre_time > 2000
                                 & d1$median_post_time > 2000]
cat('valid subjects:', length(complete_subjects))
data = subset(data_all, (subject_id %in% complete_subjects))
data = droplevels(data)


summary = ddply(data, c("subject_id", "stage", "cond", "day"), summarize, acc = mean(recorded_accuracy));
summary = ddply(data, c("subject_id", "cond", "day"), summarize, acc = mean(recorded_accuracy));

bargraph.CI(x.factor=cond,response=recorded_accuracy,group=stage,data=data[data$stage != "main",],legend=T,ylab='correct answer rate');

library(ggplot2)
ggplot(summary, aes(factor(subject_id), acc, fill = stage)) +
  geom_bar(stat="identity", position = "dodge") + 
  scale_fill_brewer(palette = "Set1")

library(lattice)
barchart(acc~subject_id,data=summary,groups=stage,ylim=c(0,1),auto.key=TRUE,xlab='subject',ylab='extremely picky accuracy');
