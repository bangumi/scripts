#!/usr/bin/env perl

# 生成 https://github.com/bangumi/scripts 中的脚本索引
#
# 执行本脚本会覆盖README.md中
# <!--GENERATED#SCRIPT-LIST#START-->
# 到
# <!--GENERATED#SCRIPT-LIST#END-->
# 的部分
#
# 支持linux / osx 未测试win
#
# author rnono
#
# LICENSE MIT

use warnings;
use strict;

sub gen_script_list {
    my @script_list = ();
    for(`grep -Rin '^##' *`) {
        if (/ ^ ([^\/]+) (?:\/) .* \[ (.*) \] \( .* \) /ix) {
            my $username = $1;
            my $script = $2;
            (my $link_id = $2) =~ s{\s+}{-}g;
            $link_id =~ tr/A-Z/a-z/;
            $link_id =~ s{[+]}{}g;

            # 脚本列表 (markdown)
            my $item = "- [$script by $username](https://github.com/bangumi/scripts/tree/master/$username#$link_id)\n";
            push @script_list, $item;
        }
    }
    @script_list;
}

sub merge_lines {
    my @old_lines = @{$_[0]};
    my @script_list = @{$_[1]};
    my @merged = ();

    my $replacing = 0;
    for(@old_lines) {
        if (!$replacing && /GENERATED#SCRIPT-LIST#START/) {
            $replacing = 1;
            push @merged, $_;
            push @merged, @script_list;
            next;
        }
        elsif($replacing && /GENERATED#SCRIPT-LIST#END/) {
            $replacing = 0;
        } elsif ($replacing) {
            next;
        }
        push @merged, $_;
    }

    @merged;
}

sub main {
    my $readme_file = "README.md";
    open(my $fh, '<', $readme_file) or die $!;
    my @lines = <$fh>;
    close $fh;

    my @script_list = gen_script_list();

    my @newlines = merge_lines(\@lines, \@script_list);

    open($fh, '>', $readme_file) or die $!;
    for(@newlines){ print $fh $_; }
    close $fh;
};

main();
print STDERR "DONE\n";
