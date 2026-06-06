package BangumiFriendRanking.V3_2_simplifyHideFeature;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class BangumiFriendRanking {
    //V3.2 增加隐藏我已收藏条目的功能，删除了Java代码执行时输入最低人数阈值的多余功能


    // 存储用户已收藏的条目ID集合
    private static Set<Integer> userCollectedSubjects = new HashSet<>();

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.println("请输入要查询友评榜的用户ID: ");
        String userId = scanner.nextLine();

        System.out.println("请输入您的Access Token: ");
        System.out.println("(请在该网址获取: https://next.bgm.tv/demo/access-token)");
        String token = scanner.nextLine();

        System.out.print("请输入要开启的线程数: ");
        int threadCount = scanner.nextInt();

        System.out.println("正在获取好友列表...");
        List<String> friendIds = getFriendIds(userId);

        ConcurrentHashMap<Integer, Animation> animationMap = new ConcurrentHashMap<>();

        // 先获取用户自己的收藏数据
        System.out.println("\n正在获取用户自己的收藏数据...");
        getUserCollectedSubjects(userId, token);

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        AtomicInteger no = new AtomicInteger(1);
        for (String friendId : friendIds) {
            int currentNo = no.getAndIncrement();
            executor.submit(new FetchDataTask(currentNo, friendId, token, animationMap));
        }

        executor.shutdown();
        while (!executor.isTerminated()) {
            try {
                executor.awaitTermination(1, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        List<Animation> sortedAnimations = calculateAndSortAverage(animationMap);
        // 移除了初始阈值过滤，现在所有条目都会显示

        System.out.println("\n数据处理完成！");
        System.out.println("总动画条目数量: " + sortedAnimations.size());
        System.out.println("用户已打分的收藏条目数量: " + userCollectedSubjects.size());
        System.out.println("正在生成排行榜文件...");

        java.time.LocalDate currentDate = java.time.LocalDate.now();
        String fileName = String.format("Ranking_%d_%02d_%02d.html",
                currentDate.getYear(),
                currentDate.getMonthValue(),
                currentDate.getDayOfMonth());
        String filePath = "C:\\Users\\Admin\\Desktop\\" + fileName;
        saveRankingToFile(sortedAnimations, filePath, userId);
        System.out.println("友评榜已保存到 " + filePath);
    }

    // 获取用户自己收藏的条目ID
    private static void getUserCollectedSubjects(String userId, String token) {
        for (int type = 2; type <= 5; type++) {
            fetchUserCollection(userId, type, token);
        }
    }

    // 获取指定类型的用户收藏数据
    private static void fetchUserCollection(String userId, int type, String token) {
        String baseUrl = "https://api.bgm.tv/v0/users/";
        String userAgent = "650688/my-friends-ranking";

        int offset = 0;
        boolean hasNextPage = true;

        while (hasNextPage) {
            String fullUrl = baseUrl + userId + "/collections?subject_type=2&limit=50&type=" + type + "&offset=" + offset;
            try {
                URL url = new URL(fullUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("User-Agent", userAgent);
                conn.setRequestProperty("Authorization", "Bearer " + token);

                if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
                    BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String inputLine;
                    while ((inputLine = in.readLine()) != null) {
                        response.append(inputLine);
                    }
                    in.close();

                    JSONObject jsonResponse = new JSONObject(response.toString());
                    JSONArray data = jsonResponse.getJSONArray("data");

                    for (int i = 0; i < data.length(); i++) {
                        JSONObject item = data.getJSONObject(i);
                        int score = item.optInt("rate", 0);

                        if (score != 0) {
                            int subjectId = item.getInt("subject_id");
                            userCollectedSubjects.add(subjectId);
                        }
                    }

                    offset += jsonResponse.getInt("limit");
                    if (offset >= jsonResponse.getInt("total")) {
                        hasNextPage = false;
                    }
                } else {
                    System.out.println("获取用户收藏数据失败: HTTP " + conn.getResponseCode());
                }

                conn.disconnect();
            } catch (IOException | JSONException e) {
                System.out.println("获取用户收藏数据时出错: " + e.getMessage());
            }
        }
    }

    private static List<String> getFriendIds(String userId) {
        List<String> friendIds = new ArrayList<>();
        friendIds.add(userId);

        String url = "https://bgm.tv/user/" + userId + "/friends";
        try {
            Document doc = Jsoup.connect(url).get();
            Elements users = doc.select("ul.usersMedium li.user a[href^=/user/]");

            System.out.println("\n发现好友数量: " + users.size());
            for (Element user : users) {
                String href = user.attr("href");
                String friendId = href.substring(href.lastIndexOf("/") + 1);
                friendIds.add(friendId);
            }
            System.out.println("总计需要查询用户数: " + friendIds.size());
        } catch (IOException e) {
            System.out.println("获取好友列表失败: " + e.getMessage());
        }

        return friendIds;
    }

    static void fetchAnimationData(String friendId, int type, String token, ConcurrentHashMap<Integer, Animation> animationMap) {
        String baseUrl = "https://api.bgm.tv/v0/users/";
        String userAgent = "650688/my-friends-ranking";

        int offset = 0;
        boolean hasNextPage = true;

        while (hasNextPage) {
            String fullUrl = baseUrl + friendId + "/collections?subject_type=2&limit=50&type=" + type + "&offset=" + offset;
            try {
                URL url = new URL(fullUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("User-Agent", userAgent);
                conn.setRequestProperty("Authorization", "Bearer " + token);

                if (conn.getResponseCode() == HttpURLConnection.HTTP_OK) {
                    BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String inputLine;
                    while ((inputLine = in.readLine()) != null) {
                        response.append(inputLine);
                    }
                    in.close();

                    JSONObject jsonResponse = new JSONObject(response.toString());
                    JSONArray data = jsonResponse.getJSONArray("data");

                    for (int i = 0; i < data.length(); i++) {
                        JSONObject item = data.getJSONObject(i);
                        int score = item.optInt("rate", 0);

                        if (score != 0) {
                            int subjectId = item.getInt("subject_id");
                            String subjectName = item.getJSONObject("subject").getString("name");
                            String subjectNameCN = item.getJSONObject("subject").optString("name_cn", "");

                            Animation animation = animationMap.computeIfAbsent(subjectId, id -> new Animation(id, subjectName, subjectNameCN));
                            animation.addFriendRating(friendId, score);
                        }
                    }

                    offset += jsonResponse.getInt("limit");
                    if (offset >= jsonResponse.getInt("total")) {
                        hasNextPage = false;
                    }
                } else {
                    System.out.println("请求失败: HTTP " + conn.getResponseCode());
                }

                conn.disconnect();
            } catch (IOException | JSONException e) {
                System.out.println("获取用户" + friendId + "数据时出错: " + e.getMessage());
            }
        }
    }

    private static List<Animation> calculateAndSortAverage(ConcurrentHashMap<Integer, Animation> animationMap) {
        List<Animation> animations = new ArrayList<>(animationMap.values());

        System.out.println("\n开始计算平均分...");
        animations.forEach(Animation::calculateAverageScore);
        animations.sort(Comparator.comparingDouble(Animation::getAverageScore).reversed());

        return animations;
    }

    private static String escapeHtml(String str) {
        if (str == null) return "";
        return str.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static void saveRankingToFile(List<Animation> animations, String filePath, String userId) {
        try (PrintWriter writer = new PrintWriter(new FileWriter(filePath))) {
            // 计算全局平均分C
            double totalSum = 0;
            int totalVotes = 0;
            for (Animation animation : animations) {
                totalSum += animation.getAverageScore() * animation.getFriendRatings().size();
                totalVotes += animation.getFriendRatings().size();
            }
            double C = totalVotes > 0 ? totalSum / totalVotes : 0;

            // 生成HTML结构
            writer.println("<!DOCTYPE html>");
            writer.println("<html lang='zh-CN'>");
            writer.println("<head>");
            writer.println("  <meta charset='UTF-8'>");
            writer.println("  <title>Bangumi友评排行榜</title>");
            writer.println("  <style>");
            writer.println("    table { width: 100%; border-collapse: collapse; margin: 20px 0; }");
            writer.println("    th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }");
            writer.println("    th { background-color: #f8f9fa; }");
            writer.println("    tr:nth-child(even) { background-color: #f2f2f2; }");
            writer.println("    a { color: #0366d6; text-decoration: none; }");
            writer.println("    a:hover { text-decoration: underline; }");
            writer.println("    .controls { margin: 20px 0; }");
            writer.println("    button { margin: 0 5px; padding: 8px 16px; }");
            writer.println("    .status-info { margin-top: 8px; font-size: 14px; }");
            writer.println("  </style>");
            writer.println("</head>");
            writer.println("<body>");
            writer.println("  <h1>Bangumi友评排行榜</h1>");
            writer.println("  <div class='status-info'>生成时间: " + new Date() + "</div>");
            writer.println("  <div class='status-info'>用户ID: " + userId + " | 总条目数: " + animations.size() + " | 用户已打分的收藏数: " + userCollectedSubjects.size() + "</div>");

            // 交互控件
            writer.println("  <div class='controls'>");
            writer.println("    <input type='number' id='mThreshold' min='0' value='1' placeholder='输入最小评分人数阈值m'>");
            writer.println("    <select id='sortMethod'>");
            writer.println("      <option value='weighted'>加权评分</option>");
            writer.println("      <option value='average'>平均分</option>");
            writer.println("      <option value='votes'>评分人数</option>");
            writer.println("    </select>");
            writer.println("    <button onclick='updateRanking()'>更新排名</button>");
            writer.println("    <button onclick='filterByVotes()'>隐藏低人数条目</button>");
            writer.println("    <button onclick='hideCollected()'>隐藏我已收藏</button>");
            writer.println("    <button onclick='showAll()'>显示所有条目</button>");
            writer.println("  </div>");

            // 数据表格
            writer.println("  <table id='rankingTable'>");
            writer.println("    <thead><tr>");
            writer.println("      <th>加权排名</th>");
            writer.println("      <th>条目原名</th>");
            writer.println("      <th>中文名称</th>");
            writer.println("      <th>评分人数</th>");
            writer.println("      <th>平均分</th>");
            writer.println("      <th>加权分数</th>");
            writer.println("      <th>条目链接</th>");
            writer.println("    </tr></thead>");
            writer.println("    <tbody>");

            // 填充表格数据，标记用户已收藏的条目
            for (Animation animation : animations) {
                boolean isCollected = userCollectedSubjects.contains(animation.getSubjectId());
                writer.printf("<tr data-v='%d' data-r='%.4f' data-collected='%b'>",
                        animation.getFriendRatings().size(),
                        animation.getAverageScore(),
                        isCollected);

                writer.printf("<td class='rank'>-</td>" +
                                "<td>%s</td>" +
                                "<td>%s</td>" +
                                "<td class='votes'>%d</td>" +
                                "<td class='average'>%.4f</td>" +
                                "<td class='weighted'>-</td>" +
                                "<td><a href='https://bgm.tv/subject/%d' target='_blank'>查看详情</a></td>" +
                                "</tr>%n",
                        escapeHtml(animation.getSubjectName()),
                        escapeHtml(animation.getSubjectNameCN()),
                        animation.getFriendRatings().size(),
                        animation.getAverageScore(),
                        animation.getSubjectId());
            }

            writer.println("    </tbody>");
            writer.println("  </table>");
            writer.println("  <div id='statusInfo' class='status-info'>当前显示: " + animations.size() + " / " + animations.size() + " 个条目</div>");

            // JavaScript逻辑
            writer.println("<script>");
            writer.printf("const globalC = %.4f;%n", C);
            writer.println("let allRows = null;");

            writer.println("function updateRanking() {");
            writer.println("  const m = parseInt(document.getElementById('mThreshold').value) || 0;");
            writer.println("  const sortMethod = document.getElementById('sortMethod').value;");
            writer.println("  const rows = Array.from(allRows || document.querySelectorAll('#rankingTable tbody tr'));");
            writer.println("  if(!allRows) allRows = rows.slice();");

            // 计算加权分数
            writer.println("  rows.forEach(row => {");
            writer.println("    const v = parseInt(row.dataset.v);");
            writer.println("    const r = parseFloat(row.dataset.r);");
            writer.println("    const weighted = (v/(v + m)) * r + (m/(v + m)) * globalC;");
            writer.println("    row.querySelector('.weighted').textContent = weighted.toFixed(4);");
            writer.println("    row.dataset.weighted = weighted;");
            writer.println("  });");

            // 获取当前可见行
            writer.println("  const visibleRows = rows.filter(row => row.style.display !== 'none');");

            // 排序逻辑
            writer.println("  visibleRows.sort((a, b) => {");
            writer.println("    let valueA, valueB;");
            writer.println("    switch(sortMethod) {");
            writer.println("      case 'weighted':");
            writer.println("        valueA = parseFloat(a.dataset.weighted);");
            writer.println("        valueB = parseFloat(b.dataset.weighted);");
            writer.println("        break;");
            writer.println("      case 'average':");
            writer.println("        valueA = parseFloat(a.dataset.r);");
            writer.println("        valueB = parseFloat(b.dataset.r);");
            writer.println("        break;");
            writer.println("      case 'votes':");
            writer.println("        valueA = parseInt(a.dataset.v);");
            writer.println("        valueB = parseInt(b.dataset.v);");
            writer.println("        break;");
            writer.println("    }");
            writer.println("    return valueB - valueA;");
            writer.println("  });");

            // 更新排名和表格
            writer.println("  const tbody = document.querySelector('#rankingTable tbody');");
            writer.println("  tbody.innerHTML = '';");
            writer.println("  visibleRows.forEach((row, index) => {");
            writer.println("    row.querySelector('.rank').textContent = index + 1;");
            writer.println("    tbody.appendChild(row);");
            writer.println("  });");

            // 更新状态信息
            writer.println("  document.getElementById('statusInfo').textContent = '当前显示: ' + visibleRows.length + ' / ' + rows.length + ' 个条目';");
            writer.println("}");

            writer.println("function filterByVotes() {");
            writer.println("  const m = parseInt(document.getElementById('mThreshold').value) || 0;");
            writer.println("  allRows.forEach(row => {");
            writer.println("    const v = parseInt(row.dataset.v);");
            writer.println("    row.style.display = v < m ? 'none' : '';");
            writer.println("  });");
            writer.println("  updateRanking();");
            writer.println("}");

            writer.println("function hideCollected() {");
            writer.println("  allRows.forEach(row => {");
            writer.println("    const isCollected = row.dataset.collected === 'true';");
            writer.println("    row.style.display = isCollected ? 'none' : '';");
            writer.println("  });");
            writer.println("  updateRanking();");
            writer.println("}");

            writer.println("function showAll() {");
            writer.println("  allRows.forEach(row => {");
            writer.println("    row.style.display = '';");
            writer.println("  });");
            writer.println("  updateRanking();");
            writer.println("}");

            writer.println("// 初始加载时执行一次");
            writer.println("document.addEventListener('DOMContentLoaded', () => {");
            writer.println("  allRows = Array.from(document.querySelectorAll('#rankingTable tbody tr'));");
            writer.println("  updateRanking();");
            writer.println("});");
            writer.println("</script>");
            writer.println("</body>");
            writer.println("</html>");
        } catch (IOException e) {
            System.out.println("文件保存失败: " + e.getMessage());
        }
    }
}

class Animation {
    private int subjectId;
    private String subjectName;
    private String subjectNameCN;
    private Map<String, Integer> friendRatings;
    private double averageScore;

    public Animation(int subjectId, String subjectName, String subjectNameCN) {
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.subjectNameCN = subjectNameCN;
        this.friendRatings = new HashMap<>();
    }

    public int getSubjectId() { return subjectId; }
    public String getSubjectName() { return subjectName; }
    public String getSubjectNameCN() { return subjectNameCN; }
    public Map<String, Integer> getFriendRatings() { return friendRatings; }
    public double getAverageScore() { return averageScore; }

    public void addFriendRating(String friendId, int score) {
        friendRatings.put(friendId, score);
    }

    public void calculateAverageScore() {
        if (!friendRatings.isEmpty()) {
            int sum = friendRatings.values().stream().mapToInt(Integer::intValue).sum();
            averageScore = (double) sum / friendRatings.size();
        } else {
            averageScore = 0.0;
        }
    }
}

class FetchDataTask implements Runnable {
    private int no;
    private String friendId;
    private String token;
    private ConcurrentHashMap<Integer, Animation> animationMap;

    public FetchDataTask(int no, String friendId, String token, ConcurrentHashMap<Integer, Animation> animationMap) {
        this.no = no;
        this.friendId = friendId;
        this.token = token;
        this.animationMap = animationMap;
    }

    public void run() {
        System.out.println("正在查询第" + no + "位好友，ID: " + friendId + " 对动画的评分...");
        for (int type = 2; type <= 5; type++) {
            BangumiFriendRanking.fetchAnimationData(friendId, type, token, animationMap);
        }
    }
}
